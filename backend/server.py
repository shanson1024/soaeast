from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ['JWT_SECRET']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============== HEALTH CHECK ==============

@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes probes (direct access)"""
    return {"status": "healthy", "service": "soa-crm-api"}

@api_router.get("/health")
async def api_health_check():
    """Health check endpoint accessible via /api/health"""
    return {"status": "healthy", "service": "soa-crm-api"}

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"
    initials: str = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    initials: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    industry: str
    tier: str = "new"
    total_revenue: float = 0.0
    total_orders: int = 0
    status: str = "active"

class ClientResponse(BaseModel):
    id: str
    name: str
    email: str
    industry: str
    tier: str
    total_revenue: float
    total_orders: int
    last_order_date: Optional[str] = None
    status: str
    created_at: str

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    industry: Optional[str] = None
    tier: Optional[str] = None
    status: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    category: str
    description: str
    base_price: float
    badge: Optional[str] = None
    margin_percent: float = 30.0
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    base_price: float
    badge: Optional[str]
    total_orders: int
    total_clients: int
    margin_percent: float
    image_url: Optional[str]
    created_at: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    badge: Optional[str] = None
    margin_percent: Optional[float] = None
    image_url: Optional[str] = None

class LineItem(BaseModel):
    product_name: str
    quantity: int = 1
    unit_price: float

class OrderCreate(BaseModel):
    client_id: str
    line_items: List[LineItem]
    status: str = "draft"
    progress_percent: int = 0
    due_date: str
    priority: str = "medium"
    notes: str = ""

class OrderResponse(BaseModel):
    id: str
    order_id: str
    client_id: str
    client_name: Optional[str] = None
    line_items: List[dict]
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    status: str
    progress_percent: int
    due_date: str
    priority: str
    notes: str = ""
    created_at: str

class OrderUpdate(BaseModel):
    line_items: Optional[List[LineItem]] = None
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class DealCreate(BaseModel):
    client_name: str
    client_id: Optional[str] = None
    amount: float
    product_description: str
    stage: str = "prospecting"
    priority: str = "medium"
    tags: List[str] = []
    owner_initials: str = "SH"
    owner_color: str = "#2d6a4f"

class DealResponse(BaseModel):
    id: str
    client_name: str
    client_id: Optional[str]
    amount: float
    product_description: str
    stage: str
    priority: str
    tags: List[str]
    owner_initials: str
    owner_color: str
    date_entered: str
    date_closed: Optional[str]
    loss_reason: Optional[str]

class DealUpdate(BaseModel):
    client_name: Optional[str] = None
    amount: Optional[float] = None
    product_description: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    loss_reason: Optional[str] = None

class DashboardStats(BaseModel):
    total_revenue: float
    open_orders: int
    new_clients: int
    avg_order_value: float
    revenue_change: float
    orders_change: int
    clients_change: int
    aov_change: float

class PipelineSummary(BaseModel):
    prospecting: float
    proposal: float
    negotiation: float
    won: float
    lost: float

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    initials = user.initials or "".join([n[0].upper() for n in user.name.split()[:2]])
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "initials": initials,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name, role=user.role, initials=initials)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"], email=user["email"], name=user["name"],
            role=user["role"], initials=user["initials"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ============== CLIENT ROUTES ==============

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if tier:
        query["tier"] = tier
    if industry:
        query["industry"] = industry
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    clients = await db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [ClientResponse(**c) for c in clients]

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, current_user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientResponse(**client)

@api_router.post("/clients", response_model=ClientResponse)
async def create_client(client: ClientCreate, current_user: dict = Depends(get_current_user)):
    client_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    client_doc = {
        "id": client_id,
        **client.model_dump(),
        "last_order_date": None,
        "created_at": now
    }
    await db.clients.insert_one(client_doc)
    return ClientResponse(**{k: v for k, v in client_doc.items() if k != "_id"})

@api_router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(client_id: str, update: ClientUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.clients.update_one({"id": client_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return ClientResponse(**client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

# ============== CLIENT DETAIL ROUTES ==============

class ClientNoteCreate(BaseModel):
    content: str
    note_type: str = "general"  # general, call, meeting, email, task

class ClientNoteResponse(BaseModel):
    id: str
    client_id: str
    content: str
    note_type: str
    created_by: str
    created_by_name: str
    created_at: str

@api_router.get("/clients/{client_id}/orders")
async def get_client_orders(client_id: str, current_user: dict = Depends(get_current_user)):
    """Get all orders for a specific client"""
    orders = await db.orders.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich orders with calculated totals
    for order in orders:
        order = enrich_order_response(order)
        order["client_name"] = None
    
    return orders

@api_router.get("/clients/{client_id}/deals")
async def get_client_deals(client_id: str, current_user: dict = Depends(get_current_user)):
    """Get all deals/pipeline items for a specific client"""
    # First get client name
    client = await db.clients.find_one({"id": client_id}, {"_id": 0, "name": 1})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    deals = await db.deals.find({"client_name": client["name"]}, {"_id": 0}).sort("date_entered", -1).to_list(100)
    return deals

@api_router.get("/clients/{client_id}/notes", response_model=List[ClientNoteResponse])
async def get_client_notes(client_id: str, current_user: dict = Depends(get_current_user)):
    """Get all notes/activity log for a specific client"""
    notes = await db.client_notes.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ClientNoteResponse(**n) for n in notes]

@api_router.post("/clients/{client_id}/notes", response_model=ClientNoteResponse)
async def create_client_note(client_id: str, note: ClientNoteCreate, current_user: dict = Depends(get_current_user)):
    """Add a note to client's activity log"""
    # Verify client exists
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    note_doc = {
        "id": note_id,
        "client_id": client_id,
        "content": note.content,
        "note_type": note.note_type,
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "created_at": now
    }
    await db.client_notes.insert_one(note_doc)
    return ClientNoteResponse(**{k: v for k, v in note_doc.items() if k != "_id"})

@api_router.delete("/clients/{client_id}/notes/{note_id}")
async def delete_client_note(client_id: str, note_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a note from client's activity log"""
    result = await db.client_notes.delete_one({"id": note_id, "client_id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ============== PRODUCT ROUTES ==============

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    badge: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if badge:
        query["badge"] = badge
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [ProductResponse(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(**product)

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    product_doc = {
        "id": product_id,
        **product.model_dump(),
        "total_orders": 0,
        "total_clients": 0,
        "created_at": now
    }
    await db.products.insert_one(product_doc)
    return ProductResponse(**{k: v for k, v in product_doc.items() if k != "_id"})

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, update: ProductUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============== ORDER ROUTES ==============

def generate_order_id():
    return f"SOA-{random.randint(1000, 9999)}"

def calculate_order_totals(line_items: list, tax_rate: float = 8.5):
    """Calculate subtotal, tax, and total for an order"""
    subtotal = sum(item.get('quantity', 1) * item.get('unit_price', 0) for item in line_items)
    tax_amount = round(subtotal * (tax_rate / 100), 2)
    total = round(subtotal + tax_amount, 2)
    return subtotal, tax_amount, total

def enrich_order_response(order: dict) -> dict:
    """Add calculated fields and ensure all required fields exist"""
    line_items = order.get('line_items', [])
    tax_rate = order.get('tax_rate', 8.5)
    subtotal, tax_amount, total = calculate_order_totals(line_items, tax_rate)
    
    order['line_items'] = line_items
    order['subtotal'] = subtotal
    order['tax_rate'] = tax_rate
    order['tax_amount'] = tax_amount
    order['total'] = total
    order['notes'] = order.get('notes', '')
    return order

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    client_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status and status != "all":
        query["status"] = status
    if priority:
        query["priority"] = priority
    if client_id:
        query["client_id"] = client_id
    if search:
        query["$or"] = [
            {"order_id": {"$regex": search, "$options": "i"}},
            {"line_items.product_name": {"$regex": search, "$options": "i"}}
        ]
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Batch fetch client names to avoid N+1 query problem
    client_ids = list(set(o.get("client_id") for o in orders if o.get("client_id")))
    if client_ids:
        clients = await db.clients.find({"id": {"$in": client_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(client_ids))
        client_map = {c["id"]: c["name"] for c in clients}
    else:
        client_map = {}
    
    # Enrich with client names and calculated totals
    for order in orders:
        if order.get("client_id"):
            order["client_name"] = client_map.get(order["client_id"], "Unknown")
        order = enrich_order_response(order)
    
    return [OrderResponse(**o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("client_id"):
        client = await db.clients.find_one({"id": order["client_id"]}, {"_id": 0, "name": 1})
        order["client_name"] = client["name"] if client else "Unknown"
    
    order = enrich_order_response(order)
    return OrderResponse(**order)

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get tax rate from settings
    settings = await db.settings.find_one({"type": "global"}, {"_id": 0})
    tax_rate = settings.get("tax_rate", 8.5) if settings else 8.5
    
    # Convert line items to dicts
    line_items = [item.model_dump() for item in order.line_items]
    subtotal, tax_amount, total = calculate_order_totals(line_items, tax_rate)
    
    order_doc = {
        "id": order_id,
        "order_id": generate_order_id(),
        "client_id": order.client_id,
        "line_items": line_items,
        "subtotal": subtotal,
        "tax_rate": tax_rate,
        "tax_amount": tax_amount,
        "total": total,
        "status": order.status,
        "progress_percent": order.progress_percent,
        "due_date": order.due_date,
        "priority": order.priority,
        "notes": order.notes,
        "created_at": now
    }
    await db.orders.insert_one(order_doc)
    
    # Update client's last order date and order count
    await db.clients.update_one(
        {"id": order.client_id},
        {"$set": {"last_order_date": now}, "$inc": {"total_orders": 1, "total_revenue": total}}
    )
    
    order_doc["client_name"] = None
    if order.client_id:
        client = await db.clients.find_one({"id": order.client_id}, {"_id": 0, "name": 1})
        order_doc["client_name"] = client["name"] if client else "Unknown"
    
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "_id"})

@api_router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, update: OrderUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {}
    
    # Handle line items specially to recalculate totals
    if update.line_items is not None:
        line_items = [item.model_dump() for item in update.line_items]
        settings = await db.settings.find_one({"type": "global"}, {"_id": 0})
        tax_rate = settings.get("tax_rate", 8.5) if settings else 8.5
        subtotal, tax_amount, total = calculate_order_totals(line_items, tax_rate)
        update_data["line_items"] = line_items
        update_data["subtotal"] = subtotal
        update_data["tax_rate"] = tax_rate
        update_data["tax_amount"] = tax_amount
        update_data["total"] = total
    
    # Add other fields
    for field in ['status', 'progress_percent', 'due_date', 'priority', 'notes']:
        value = getattr(update, field)
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if order.get("client_id"):
        client = await db.clients.find_one({"id": order["client_id"]}, {"_id": 0, "name": 1})
        order["client_name"] = client["name"] if client else "Unknown"
    
    order = enrich_order_response(order)
    return OrderResponse(**order)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# ============== DEAL/PIPELINE ROUTES ==============

@api_router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if stage:
        query["stage"] = stage
    if priority:
        query["priority"] = priority
    if search:
        query["$or"] = [
            {"client_name": {"$regex": search, "$options": "i"}},
            {"product_description": {"$regex": search, "$options": "i"}}
        ]
    
    deals = await db.deals.find(query, {"_id": 0}).sort("date_entered", -1).to_list(1000)
    return [DealResponse(**d) for d in deals]

@api_router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: str, current_user: dict = Depends(get_current_user)):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealResponse(**deal)

@api_router.post("/deals", response_model=DealResponse)
async def create_deal(deal: DealCreate, current_user: dict = Depends(get_current_user)):
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    deal_doc = {
        "id": deal_id,
        **deal.model_dump(),
        "date_entered": now,
        "date_closed": None,
        "loss_reason": None
    }
    await db.deals.insert_one(deal_doc)
    return DealResponse(**{k: v for k, v in deal_doc.items() if k != "_id"})

@api_router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(deal_id: str, update: DealUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Set date_closed if stage is won or lost
    if update.stage in ["won", "lost"]:
        update_data["date_closed"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return DealResponse(**deal)

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.deals.delete_one({"id": deal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Deal deleted"}

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Get total revenue from orders
    orders = await db.orders.find({}, {"_id": 0, "amount": 1, "status": 1, "created_at": 1}).to_list(1000)
    total_revenue = sum(o.get("amount", 0) for o in orders)
    open_orders = len([o for o in orders if o.get("status") not in ["delivered", "cancelled"]])
    
    # Get new clients (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    clients = await db.clients.find({}, {"_id": 0, "created_at": 1}).to_list(1000)
    new_clients = len([c for c in clients if c.get("created_at", "") >= thirty_days_ago])
    
    # Calculate avg order value
    avg_order_value = total_revenue / len(orders) if orders else 0
    
    return DashboardStats(
        total_revenue=total_revenue,
        open_orders=open_orders,
        new_clients=new_clients,
        avg_order_value=round(avg_order_value, 2),
        revenue_change=12.4,  # Mock data for demo
        orders_change=8,
        clients_change=3,
        aov_change=-2.1
    )

@api_router.get("/dashboard/pipeline-summary", response_model=PipelineSummary)
async def get_pipeline_summary(current_user: dict = Depends(get_current_user)):
    deals = await db.deals.find({}, {"_id": 0, "stage": 1, "amount": 1}).to_list(1000)
    
    summary = {"prospecting": 0, "proposal": 0, "negotiation": 0, "won": 0, "lost": 0}
    for deal in deals:
        stage = deal.get("stage", "prospecting")
        amount = deal.get("amount", 0)
        if stage in summary:
            summary[stage] += amount
    
    return PipelineSummary(**summary)

@api_router.get("/dashboard/sales-trend")
async def get_sales_trend(current_user: dict = Depends(get_current_user)):
    # Return mock monthly sales data
    months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    return [
        {"month": m, "new_clients": random.randint(3, 15), "repeat_clients": random.randint(5, 20)}
        for m in months
    ]

@api_router.get("/dashboard/recent-deals")
async def get_recent_deals(current_user: dict = Depends(get_current_user)):
    deals = await db.deals.find({}, {"_id": 0}).sort("date_entered", -1).limit(10).to_list(10)
    return deals

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        return {"message": "Database already seeded", "seeded": False}
    
    # Seed users
    users = [
        {"id": str(uuid.uuid4()), "email": "scott@soaeast.com", "password": hash_password("admin123"), "name": "Scott", "role": "CEO / President", "initials": "SH", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "email": "john@soaeast.com", "password": hash_password("user123"), "name": "John Roberts", "role": "Sales Manager", "initials": "JR", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "email": "mary@soaeast.com", "password": hash_password("user123"), "name": "Mary Kim", "role": "Account Executive", "initials": "MK", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.users.insert_many(users)
    
    # Seed clients
    industries = ["Healthcare", "Technology", "Real Estate", "Fitness", "Food & Beverage", "Consulting", "Education", "Insurance", "Services", "Automotive"]
    tiers = ["gold", "silver", "bronze", "new"]
    clients_data = [
        {"name": "MedTech Solutions", "email": "contact@medtech.com", "industry": "Healthcare", "tier": "gold", "total_revenue": 45000, "total_orders": 12},
        {"name": "TechStart Inc", "email": "info@techstart.com", "industry": "Technology", "tier": "silver", "total_revenue": 28000, "total_orders": 8},
        {"name": "Premier Realty", "email": "sales@premierrealty.com", "industry": "Real Estate", "tier": "gold", "total_revenue": 52000, "total_orders": 15},
        {"name": "FitLife Gym", "email": "orders@fitlife.com", "industry": "Fitness", "tier": "bronze", "total_revenue": 12000, "total_orders": 4},
        {"name": "Gourmet Eats", "email": "events@gourmeteats.com", "industry": "Food & Beverage", "tier": "silver", "total_revenue": 18000, "total_orders": 6},
        {"name": "Strategy Plus", "email": "admin@strategyplus.com", "industry": "Consulting", "tier": "gold", "total_revenue": 38000, "total_orders": 10},
        {"name": "EduLearn Academy", "email": "procurement@edulearn.com", "industry": "Education", "tier": "bronze", "total_revenue": 8500, "total_orders": 3},
        {"name": "SafeGuard Insurance", "email": "marketing@safeguard.com", "industry": "Insurance", "tier": "silver", "total_revenue": 22000, "total_orders": 7},
        {"name": "CleanPro Services", "email": "orders@cleanpro.com", "industry": "Services", "tier": "new", "total_revenue": 5000, "total_orders": 2},
        {"name": "AutoMax Dealers", "email": "promo@automax.com", "industry": "Automotive", "tier": "gold", "total_revenue": 65000, "total_orders": 18},
        {"name": "Wellness Center", "email": "info@wellness.com", "industry": "Healthcare", "tier": "bronze", "total_revenue": 9500, "total_orders": 3},
        {"name": "Digital Dynamics", "email": "hello@digitaldyn.com", "industry": "Technology", "tier": "new", "total_revenue": 3500, "total_orders": 1},
        {"name": "Urban Properties", "email": "contact@urbanprop.com", "industry": "Real Estate", "tier": "silver", "total_revenue": 31000, "total_orders": 9},
        {"name": "Fresh Bites Cafe", "email": "orders@freshbites.com", "industry": "Food & Beverage", "tier": "bronze", "total_revenue": 7200, "total_orders": 2},
        {"name": "Learning Hub", "email": "admin@learninghub.com", "industry": "Education", "tier": "new", "total_revenue": 2800, "total_orders": 1},
    ]
    
    client_ids = []
    for c in clients_data:
        client_id = str(uuid.uuid4())
        client_ids.append(client_id)
        c["id"] = client_id
        c["status"] = "active" if random.random() > 0.2 else "inactive"
        c["last_order_date"] = (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))).isoformat()
        c["created_at"] = (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365))).isoformat()
    
    await db.clients.insert_many(clients_data)
    
    # Seed products
    products_data = [
        {"name": "Premium Polo Shirt", "category": "apparel", "description": "High-quality embroidered polo shirts with custom logo placement", "base_price": 24.99, "badge": "popular", "margin_percent": 35},
        {"name": "Custom T-Shirts", "category": "apparel", "description": "Soft cotton tees with full-color DTG printing", "base_price": 12.99, "badge": None, "margin_percent": 40},
        {"name": "Branded Hoodie", "category": "apparel", "description": "Cozy fleece hoodie with embroidered or printed logo", "base_price": 38.99, "badge": "new", "margin_percent": 30},
        {"name": "Insulated Travel Mug", "category": "drinkware", "description": "20oz stainless steel tumbler keeps drinks hot or cold", "base_price": 18.99, "badge": "popular", "margin_percent": 45},
        {"name": "Ceramic Coffee Mug", "category": "drinkware", "description": "Classic 11oz mug with full wrap printing", "base_price": 8.99, "badge": None, "margin_percent": 50},
        {"name": "Wireless Charger Pad", "category": "tech", "description": "10W fast charging pad with custom logo", "base_price": 22.99, "badge": "new", "margin_percent": 38},
        {"name": "USB Power Bank", "category": "tech", "description": "10000mAh portable charger with dual ports", "base_price": 28.99, "badge": "popular", "margin_percent": 32},
        {"name": "Canvas Tote Bag", "category": "bags", "description": "Sturdy cotton canvas bag with reinforced handles", "base_price": 14.99, "badge": None, "margin_percent": 48},
        {"name": "Executive Notebook", "category": "office", "description": "Hardcover journal with ribbon bookmark and pen loop", "base_price": 16.99, "badge": "seasonal", "margin_percent": 42},
        {"name": "Branded Pen Set", "category": "office", "description": "Premium metal pens with laser engraving", "base_price": 9.99, "badge": None, "margin_percent": 55},
        {"name": "Welcome Gift Box", "category": "gifts", "description": "Curated gift set with mug, pen, and notebook", "base_price": 45.99, "badge": "popular", "margin_percent": 35},
        {"name": "Golf Umbrella", "category": "outdoor", "description": "Large windproof umbrella with custom panel printing", "base_price": 32.99, "badge": "seasonal", "margin_percent": 28},
    ]
    
    for p in products_data:
        p["id"] = str(uuid.uuid4())
        p["total_orders"] = random.randint(10, 100)
        p["total_clients"] = random.randint(5, 30)
        p["image_url"] = None
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_many(products_data)
    
    # Seed orders
    statuses = ["draft", "production", "shipped", "delivered"]
    priorities = ["high", "medium", "low"]
    orders_data = []
    for i in range(10):
        orders_data.append({
            "id": str(uuid.uuid4()),
            "order_id": f"SOA-{1000 + i}",
            "client_id": random.choice(client_ids),
            "products_description": random.choice(["100x Polo Shirts", "250x Tote Bags", "500x Ceramic Mugs", "75x Gift Boxes", "200x Notebooks"]),
            "amount": round(random.uniform(1500, 8000), 2),
            "status": random.choice(statuses),
            "progress_percent": random.randint(0, 100),
            "due_date": (datetime.now(timezone.utc) + timedelta(days=random.randint(-5, 30))).isoformat()[:10],
            "priority": random.choice(priorities),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).isoformat()
        })
    
    await db.orders.insert_many(orders_data)
    
    # Seed deals
    stages = ["prospecting", "proposal", "negotiation", "won", "lost"]
    tags_options = [["Apparel"], ["Drinkware"], ["Tech"], ["Bags"], ["Office"], ["Gifts"], ["Outdoor"], ["Apparel", "Gifts"], ["Tech", "Office"]]
    owner_data = [
        {"initials": "SH", "color": "#2d6a4f"},
        {"initials": "JR", "color": "#4a5fd7"},
        {"initials": "MK", "color": "#7c3aed"}
    ]
    
    deals_data = []
    for i in range(15):
        owner = random.choice(owner_data)
        stage = random.choice(stages)
        deals_data.append({
            "id": str(uuid.uuid4()),
            "client_name": random.choice(["Tech Solutions", "Premier Corp", "Urban Events", "MedGroup", "AutoPlex", "GreenLeaf Co", "Summit Partners", "BlueWave Inc", "Nexus Holdings", "Pinnacle Ltd"]),
            "client_id": random.choice(client_ids) if random.random() > 0.3 else None,
            "amount": round(random.uniform(2000, 15000), 2),
            "product_description": random.choice(["Employee welcome kits", "Trade show giveaways", "Client appreciation gifts", "Team uniforms", "Conference swag bags"]),
            "stage": stage,
            "priority": random.choice(priorities),
            "tags": random.choice(tags_options),
            "owner_initials": owner["initials"],
            "owner_color": owner["color"],
            "date_entered": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))).isoformat(),
            "date_closed": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10))).isoformat() if stage in ["won", "lost"] else None,
            "loss_reason": random.choice(["Budget constraints", "Went with competitor", "Project cancelled"]) if stage == "lost" else None
        })
    
    await db.deals.insert_many(deals_data)
    
    return {"message": "Database seeded successfully", "seeded": True}

# ============== ROLES & TEAM MANAGEMENT ==============

class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permissions: dict = {}
    color: str = "#2d6a4f"

class RoleResponse(BaseModel):
    id: str
    name: str
    description: str
    permissions: dict
    color: str
    user_count: int = 0
    created_at: str

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[dict] = None
    color: Optional[str] = None

class TeamMemberResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    role_id: Optional[str] = None
    initials: str
    status: str = "active"
    created_at: str

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[str] = None
    status: Optional[str] = None

# Default permissions structure
DEFAULT_PERMISSIONS = {
    "dashboard": {"view": True},
    "clients": {"view": True, "create": True, "edit": True, "delete": False},
    "products": {"view": True, "create": True, "edit": True, "delete": False},
    "orders": {"view": True, "create": True, "edit": True, "delete": False},
    "pipeline": {"view": True, "create": True, "edit": True, "delete": False},
    "reports": {"view": True, "export": False},
    "settings": {"view": False, "edit": False},
    "team": {"view": False, "manage": False}
}

@api_router.get("/roles", response_model=List[RoleResponse])
async def get_roles(current_user: dict = Depends(get_current_user)):
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    
    # Count users per role
    for role in roles:
        user_count = await db.users.count_documents({"role_id": role["id"]})
        role["user_count"] = user_count
    
    return [RoleResponse(**r) for r in roles]

@api_router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: str, current_user: dict = Depends(get_current_user)):
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    user_count = await db.users.count_documents({"role_id": role_id})
    role["user_count"] = user_count
    
    return RoleResponse(**role)

@api_router.post("/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate, current_user: dict = Depends(get_current_user)):
    role_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Merge with default permissions
    permissions = {**DEFAULT_PERMISSIONS}
    for key, value in role.permissions.items():
        if key in permissions:
            permissions[key] = {**permissions[key], **value}
    
    role_doc = {
        "id": role_id,
        "name": role.name,
        "description": role.description,
        "permissions": permissions,
        "color": role.color,
        "created_at": now
    }
    await db.roles.insert_one(role_doc)
    role_doc["user_count"] = 0
    return RoleResponse(**{k: v for k, v in role_doc.items() if k != "_id"})

@api_router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(role_id: str, update: RoleUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.roles.update_one({"id": role_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    user_count = await db.users.count_documents({"role_id": role_id})
    role["user_count"] = user_count
    
    return RoleResponse(**role)

@api_router.delete("/roles/{role_id}")
async def delete_role(role_id: str, current_user: dict = Depends(get_current_user)):
    # Check if users are assigned to this role
    user_count = await db.users.count_documents({"role_id": role_id})
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role with {user_count} assigned users")
    
    result = await db.roles.delete_one({"id": role_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role deleted"}

# Team Management Endpoints
@api_router.get("/team", response_model=List[TeamMemberResponse])
async def get_team_members(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return [TeamMemberResponse(**{**u, "status": u.get("status", "active")}) for u in users]

@api_router.put("/team/{user_id}", response_model=TeamMemberResponse)
async def update_team_member(user_id: str, update: TeamMemberUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return TeamMemberResponse(**{**user, "status": user.get("status", "active")})

@api_router.post("/team/invite")
async def invite_team_member(
    email: str,
    name: str,
    role_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if email already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Get role info
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    user_id = str(uuid.uuid4())
    initials = "".join([n[0].upper() for n in name.split()[:2]])
    temp_password = f"temp{random.randint(1000, 9999)}"
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password": hash_password(temp_password),
        "name": name,
        "role": role["name"],
        "role_id": role_id,
        "initials": initials,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return {
        "message": "Team member invited",
        "user_id": user_id,
        "temp_password": temp_password  # In production, send via email
    }

# Seed default roles
@api_router.post("/roles/seed-defaults")
async def seed_default_roles():
    existing = await db.roles.count_documents({})
    if existing > 0:
        return {"message": "Roles already exist", "seeded": False}
    
    default_roles = [
        {
            "id": str(uuid.uuid4()),
            "name": "Administrator",
            "description": "Full access to all features and settings",
            "color": "#2d6a4f",
            "permissions": {
                "dashboard": {"view": True},
                "clients": {"view": True, "create": True, "edit": True, "delete": True},
                "products": {"view": True, "create": True, "edit": True, "delete": True},
                "orders": {"view": True, "create": True, "edit": True, "delete": True},
                "pipeline": {"view": True, "create": True, "edit": True, "delete": True},
                "reports": {"view": True, "export": True},
                "settings": {"view": True, "edit": True},
                "team": {"view": True, "manage": True}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sales Manager",
            "description": "Manage sales team, clients, and pipeline",
            "color": "#4a5fd7",
            "permissions": {
                "dashboard": {"view": True},
                "clients": {"view": True, "create": True, "edit": True, "delete": False},
                "products": {"view": True, "create": False, "edit": False, "delete": False},
                "orders": {"view": True, "create": True, "edit": True, "delete": False},
                "pipeline": {"view": True, "create": True, "edit": True, "delete": True},
                "reports": {"view": True, "export": True},
                "settings": {"view": False, "edit": False},
                "team": {"view": True, "manage": False}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Account Executive",
            "description": "Manage own clients and deals",
            "color": "#7c3aed",
            "permissions": {
                "dashboard": {"view": True},
                "clients": {"view": True, "create": True, "edit": True, "delete": False},
                "products": {"view": True, "create": False, "edit": False, "delete": False},
                "orders": {"view": True, "create": True, "edit": False, "delete": False},
                "pipeline": {"view": True, "create": True, "edit": True, "delete": False},
                "reports": {"view": True, "export": False},
                "settings": {"view": False, "edit": False},
                "team": {"view": False, "manage": False}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Viewer",
            "description": "Read-only access to data",
            "color": "#6b7280",
            "permissions": {
                "dashboard": {"view": True},
                "clients": {"view": True, "create": False, "edit": False, "delete": False},
                "products": {"view": True, "create": False, "edit": False, "delete": False},
                "orders": {"view": True, "create": False, "edit": False, "delete": False},
                "pipeline": {"view": True, "create": False, "edit": False, "delete": False},
                "reports": {"view": True, "export": False},
                "settings": {"view": False, "edit": False},
                "team": {"view": False, "manage": False}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.roles.insert_many(default_roles)
    return {"message": "Default roles created", "seeded": True, "count": len(default_roles)}

# ============== BROKERS MANAGEMENT ==============

class BrokerCreate(BaseModel):
    name: str
    company: str
    email: EmailStr
    phone: str = ""
    territory: str = ""
    commission_rate: float = 10.0
    status: str = "active"
    notes: str = ""

class BrokerResponse(BaseModel):
    id: str
    name: str
    company: str
    email: str
    phone: str
    territory: str
    commission_rate: float
    status: str
    notes: str
    total_sales: float
    total_deals: int
    created_at: str

class BrokerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    territory: Optional[str] = None
    commission_rate: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

@api_router.get("/brokers", response_model=List[BrokerResponse])
async def get_brokers(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    brokers = await db.brokers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [BrokerResponse(**b) for b in brokers]

@api_router.get("/brokers/{broker_id}", response_model=BrokerResponse)
async def get_broker(broker_id: str, current_user: dict = Depends(get_current_user)):
    broker = await db.brokers.find_one({"id": broker_id}, {"_id": 0})
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")
    return BrokerResponse(**broker)

@api_router.post("/brokers", response_model=BrokerResponse)
async def create_broker(broker: BrokerCreate, current_user: dict = Depends(get_current_user)):
    broker_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    broker_doc = {
        "id": broker_id,
        **broker.model_dump(),
        "total_sales": 0,
        "total_deals": 0,
        "created_at": now
    }
    await db.brokers.insert_one(broker_doc)
    return BrokerResponse(**{k: v for k, v in broker_doc.items() if k != "_id"})

@api_router.put("/brokers/{broker_id}", response_model=BrokerResponse)
async def update_broker(broker_id: str, update: BrokerUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.brokers.update_one({"id": broker_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    broker = await db.brokers.find_one({"id": broker_id}, {"_id": 0})
    return BrokerResponse(**broker)

@api_router.delete("/brokers/{broker_id}")
async def delete_broker(broker_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.brokers.delete_one({"id": broker_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Broker not found")
    return {"message": "Broker deleted"}

@api_router.post("/brokers/{broker_id}/record-sale")
async def record_broker_sale(
    broker_id: str,
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    """Record a sale for a broker"""
    result = await db.brokers.update_one(
        {"id": broker_id},
        {"$inc": {"total_sales": amount, "total_deals": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    broker = await db.brokers.find_one({"id": broker_id}, {"_id": 0})
    return BrokerResponse(**broker)

# Reset and create clean demo data
@api_router.post("/reset-demo")
async def reset_demo_data(current_user: dict = Depends(get_current_user)):
    """Clear all data and create clean demo data with one deal per stage"""
    
    # Clear existing data (except users and roles)
    await db.deals.delete_many({})
    await db.orders.delete_many({})
    await db.clients.delete_many({})
    await db.products.delete_many({})
    await db.brokers.delete_many({})
    
    now = datetime.now(timezone.utc)
    
    # Create 5 clients (one for each deal stage)
    clients_data = [
        {"id": str(uuid.uuid4()), "name": "TechStart Inc", "email": "sales@techstart.com", "industry": "Technology", "tier": "new", "total_revenue": 0, "total_orders": 0, "status": "active", "last_order_date": None, "created_at": (now - timedelta(days=30)).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Premier Healthcare", "email": "orders@premierhc.com", "industry": "Healthcare", "tier": "silver", "total_revenue": 0, "total_orders": 0, "status": "active", "last_order_date": None, "created_at": (now - timedelta(days=45)).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Urban Fitness", "email": "marketing@urbanfit.com", "industry": "Fitness", "tier": "bronze", "total_revenue": 0, "total_orders": 0, "status": "active", "last_order_date": None, "created_at": (now - timedelta(days=60)).isoformat()},
        {"id": str(uuid.uuid4()), "name": "AutoMax Dealers", "email": "promo@automax.com", "industry": "Automotive", "tier": "gold", "total_revenue": 15000, "total_orders": 2, "status": "active", "last_order_date": (now - timedelta(days=5)).isoformat(), "created_at": (now - timedelta(days=90)).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Budget Corp", "email": "info@budgetcorp.com", "industry": "Services", "tier": "new", "total_revenue": 0, "total_orders": 0, "status": "active", "last_order_date": None, "created_at": (now - timedelta(days=20)).isoformat()},
    ]
    await db.clients.insert_many(clients_data)
    
    # Create products
    products_data = [
        {"id": str(uuid.uuid4()), "name": "Custom Polo Shirts", "category": "apparel", "description": "Premium embroidered polo shirts with company logo", "base_price": 28.99, "badge": "popular", "total_orders": 5, "total_clients": 3, "margin_percent": 35, "image_url": None, "created_at": now.isoformat()},
        {"id": str(uuid.uuid4()), "name": "Branded Tote Bags", "category": "bags", "description": "Eco-friendly canvas tote bags with custom print", "base_price": 15.99, "badge": None, "total_orders": 3, "total_clients": 2, "margin_percent": 45, "image_url": None, "created_at": now.isoformat()},
        {"id": str(uuid.uuid4()), "name": "Insulated Tumblers", "category": "drinkware", "description": "20oz stainless steel tumblers with laser engraving", "base_price": 22.99, "badge": "new", "total_orders": 4, "total_clients": 3, "margin_percent": 40, "image_url": None, "created_at": now.isoformat()},
        {"id": str(uuid.uuid4()), "name": "Executive Notebooks", "category": "office", "description": "Leather-bound journals with embossed logo", "base_price": 18.99, "badge": None, "total_orders": 2, "total_clients": 2, "margin_percent": 50, "image_url": None, "created_at": now.isoformat()},
        {"id": str(uuid.uuid4()), "name": "Welcome Gift Sets", "category": "gifts", "description": "Curated gift box with mug, notebook, and pen", "base_price": 45.99, "badge": "popular", "total_orders": 3, "total_clients": 2, "margin_percent": 38, "image_url": None, "created_at": now.isoformat()},
    ]
    await db.products.insert_many(products_data)
    
    # Create 5 deals - one for each stage
    deals_data = [
        {
            "id": str(uuid.uuid4()),
            "client_name": "TechStart Inc",
            "client_id": clients_data[0]["id"],
            "amount": 8500,
            "product_description": "500 Custom Polo Shirts for company rebrand",
            "stage": "prospecting",
            "priority": "medium",
            "tags": ["Apparel"],
            "owner_initials": "SH",
            "owner_color": "#2d6a4f",
            "date_entered": (now - timedelta(days=3)).isoformat(),
            "date_closed": None,
            "loss_reason": None
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "Premier Healthcare",
            "client_id": clients_data[1]["id"],
            "amount": 12000,
            "product_description": "Welcome kits for new employees - tumblers & notebooks",
            "stage": "proposal",
            "priority": "high",
            "tags": ["Drinkware", "Office"],
            "owner_initials": "JR",
            "owner_color": "#4a5fd7",
            "date_entered": (now - timedelta(days=7)).isoformat(),
            "date_closed": None,
            "loss_reason": None
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "Urban Fitness",
            "client_id": clients_data[2]["id"],
            "amount": 6500,
            "product_description": "Branded tote bags for gym membership drive",
            "stage": "negotiation",
            "priority": "medium",
            "tags": ["Bags"],
            "owner_initials": "MK",
            "owner_color": "#7c3aed",
            "date_entered": (now - timedelta(days=14)).isoformat(),
            "date_closed": None,
            "loss_reason": None
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "AutoMax Dealers",
            "client_id": clients_data[3]["id"],
            "amount": 15000,
            "product_description": "Executive gift sets for VIP customers",
            "stage": "won",
            "priority": "high",
            "tags": ["Gifts"],
            "owner_initials": "SH",
            "owner_color": "#2d6a4f",
            "date_entered": (now - timedelta(days=21)).isoformat(),
            "date_closed": (now - timedelta(days=5)).isoformat(),
            "loss_reason": None
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "Budget Corp",
            "client_id": clients_data[4]["id"],
            "amount": 3500,
            "product_description": "Basic polo shirts for staff uniforms",
            "stage": "lost",
            "priority": "low",
            "tags": ["Apparel"],
            "owner_initials": "JR",
            "owner_color": "#4a5fd7",
            "date_entered": (now - timedelta(days=28)).isoformat(),
            "date_closed": (now - timedelta(days=10)).isoformat(),
            "loss_reason": "Went with cheaper competitor"
        },
    ]
    await db.deals.insert_many(deals_data)
    
    # Create orders for the won deal
    orders_data = [
        {
            "id": str(uuid.uuid4()),
            "order_id": "SOA-1001",
            "client_id": clients_data[3]["id"],
            "products_description": "200x Executive Gift Sets",
            "amount": 9200,
            "status": "delivered",
            "progress_percent": 100,
            "due_date": (now - timedelta(days=5)).isoformat()[:10],
            "priority": "high",
            "created_at": (now - timedelta(days=15)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "order_id": "SOA-1002",
            "client_id": clients_data[3]["id"],
            "products_description": "100x Executive Gift Sets (Phase 2)",
            "amount": 5800,
            "status": "production",
            "progress_percent": 65,
            "due_date": (now + timedelta(days=7)).isoformat()[:10],
            "priority": "medium",
            "created_at": (now - timedelta(days=3)).isoformat()
        },
    ]
    await db.orders.insert_many(orders_data)
    
    return {
        "message": "Demo data reset successfully",
        "data": {
            "clients": len(clients_data),
            "products": len(products_data),
            "deals": len(deals_data),
            "orders": len(orders_data)
        }
    }

# ============== MESSAGES ==============

class MessageCreate(BaseModel):
    recipient_id: Optional[str] = None
    recipient_name: str
    subject: str
    content: str
    message_type: str = "internal"  # internal, client, system

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    recipient_id: Optional[str]
    recipient_name: str
    subject: str
    content: str
    message_type: str
    is_read: bool
    created_at: str

@api_router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    message_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [{"sender_id": current_user["id"]}, {"recipient_id": current_user["id"]}]}
    if message_type:
        query["message_type"] = message_type
    if is_read is not None:
        query["is_read"] = is_read
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [MessageResponse(**m) for m in messages]

@api_router.post("/messages", response_model=MessageResponse)
async def create_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        **message.model_dump(),
        "is_read": False,
        "created_at": now
    }
    await db.messages.insert_one(message_doc)
    return MessageResponse(**{k: v for k, v in message_doc.items() if k != "_id"})

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.messages.update_one({"id": message_id}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message marked as read"}

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted"}

# ============== CHANNELS ==============

class ChannelCreate(BaseModel):
    name: str
    channel_type: str  # direct, retail, online, wholesale, referral
    description: str = ""
    contact_email: str = ""
    commission_rate: float = 0.0
    status: str = "active"

class ChannelResponse(BaseModel):
    id: str
    name: str
    channel_type: str
    description: str
    contact_email: str
    commission_rate: float
    status: str
    total_revenue: float
    total_orders: int
    created_at: str

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    channel_type: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    commission_rate: Optional[float] = None
    status: Optional[str] = None

@api_router.get("/channels", response_model=List[ChannelResponse])
async def get_channels(
    status: Optional[str] = None,
    channel_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if channel_type:
        query["channel_type"] = channel_type
    
    channels = await db.channels.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ChannelResponse(**c) for c in channels]

@api_router.post("/channels", response_model=ChannelResponse)
async def create_channel(channel: ChannelCreate, current_user: dict = Depends(get_current_user)):
    channel_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    channel_doc = {
        "id": channel_id,
        **channel.model_dump(),
        "total_revenue": 0,
        "total_orders": 0,
        "created_at": now
    }
    await db.channels.insert_one(channel_doc)
    return ChannelResponse(**{k: v for k, v in channel_doc.items() if k != "_id"})

@api_router.put("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(channel_id: str, update: ChannelUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.channels.update_one({"id": channel_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    return ChannelResponse(**channel)

@api_router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.channels.delete_one({"id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "Channel deleted"}

# ============== INTEGRATIONS ==============

class IntegrationCreate(BaseModel):
    name: str
    integration_type: str  # payment, email, shipping, analytics, crm
    provider: str
    api_key: str = ""
    webhook_url: str = ""
    settings: dict = {}
    status: str = "inactive"

class IntegrationResponse(BaseModel):
    id: str
    name: str
    integration_type: str
    provider: str
    status: str
    settings: dict
    last_sync: Optional[str]
    created_at: str

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    settings: Optional[dict] = None
    status: Optional[str] = None

@api_router.get("/integrations", response_model=List[IntegrationResponse])
async def get_integrations(current_user: dict = Depends(get_current_user)):
    integrations = await db.integrations.find({}, {"_id": 0, "api_key": 0}).to_list(100)
    return [IntegrationResponse(**i) for i in integrations]

@api_router.post("/integrations", response_model=IntegrationResponse)
async def create_integration(integration: IntegrationCreate, current_user: dict = Depends(get_current_user)):
    integration_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    integration_doc = {
        "id": integration_id,
        **integration.model_dump(),
        "last_sync": None,
        "created_at": now
    }
    await db.integrations.insert_one(integration_doc)
    response_doc = {k: v for k, v in integration_doc.items() if k not in ["_id", "api_key", "webhook_url"]}
    return IntegrationResponse(**response_doc)

@api_router.put("/integrations/{integration_id}", response_model=IntegrationResponse)
async def update_integration(integration_id: str, update: IntegrationUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.integrations.update_one({"id": integration_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = await db.integrations.find_one({"id": integration_id}, {"_id": 0, "api_key": 0, "webhook_url": 0})
    return IntegrationResponse(**integration)

@api_router.delete("/integrations/{integration_id}")
async def delete_integration(integration_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.integrations.delete_one({"id": integration_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"message": "Integration deleted"}

@api_router.post("/integrations/{integration_id}/test")
async def test_integration(integration_id: str, current_user: dict = Depends(get_current_user)):
    integration = await db.integrations.find_one({"id": integration_id}, {"_id": 0})
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Simulate test - in production would actually test the API
    await db.integrations.update_one(
        {"id": integration_id}, 
        {"$set": {"last_sync": datetime.now(timezone.utc).isoformat(), "status": "active"}}
    )
    return {"success": True, "message": f"Integration {integration['name']} tested successfully"}

# ============== SETTINGS ==============

class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    currency: Optional[str] = None
    tax_rate: Optional[float] = None
    notifications: Optional[dict] = None
    email_settings: Optional[dict] = None
    security_settings: Optional[dict] = None

@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"type": "global"}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "company_name": "SOA East LLC",
            "company_email": "contact@soaeast.com",
            "company_phone": "+1 (555) 123-4567",
            "company_address": "123 Business Ave, Suite 100, City, State 12345",
            "industry": "Promotional Products",
            "timezone": "America/New_York",
            "date_format": "MM/DD/YYYY",
            "currency": "USD",
            "tax_rate": 8.5,
            "notifications": {
                "push": True,
                "desktop": False,
                "sound": True
            },
            "email_settings": {
                "order_updates": True,
                "new_clients": True,
                "pipeline_movement": False,
                "weekly_reports": True
            },
            "security_settings": {
                "two_factor": False,
                "session_timeout": True
            }
        }
    return settings

@api_router.put("/settings")
async def update_settings(update: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["id"]
    
    await db.settings.update_one(
        {"type": "global"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"type": "global"}, {"_id": 0})
    return settings

# ============== EXPORT ENDPOINTS ==============

@api_router.get("/export/clients")
async def export_clients(current_user: dict = Depends(get_current_user)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return {"data": clients, "count": len(clients), "type": "clients"}

@api_router.get("/export/orders")
async def export_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return {"data": orders, "count": len(orders), "type": "orders"}

@api_router.get("/export/deals")
async def export_deals(current_user: dict = Depends(get_current_user)):
    deals = await db.deals.find({}, {"_id": 0}).to_list(1000)
    return {"data": deals, "count": len(deals), "type": "deals"}

@api_router.get("/export/products")
async def export_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return {"data": products, "count": len(products), "type": "products"}

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "SOA East LLC CRM API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

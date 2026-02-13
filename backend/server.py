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
SECRET_KEY = os.environ.get('JWT_SECRET', 'soa-east-llc-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

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

class OrderCreate(BaseModel):
    client_id: str
    products_description: str
    amount: float
    status: str = "draft"
    progress_percent: int = 0
    due_date: str
    priority: str = "medium"

class OrderResponse(BaseModel):
    id: str
    order_id: str
    client_id: str
    client_name: Optional[str] = None
    products_description: str
    amount: float
    status: str
    progress_percent: int
    due_date: str
    priority: str
    created_at: str

class OrderUpdate(BaseModel):
    products_description: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None

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

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status and status != "all":
        query["status"] = status
    if priority:
        query["priority"] = priority
    if search:
        query["$or"] = [
            {"order_id": {"$regex": search, "$options": "i"}},
            {"products_description": {"$regex": search, "$options": "i"}}
        ]
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with client names
    for order in orders:
        if order.get("client_id"):
            client = await db.clients.find_one({"id": order["client_id"]}, {"_id": 0, "name": 1})
            order["client_name"] = client["name"] if client else "Unknown"
    
    return [OrderResponse(**o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("client_id"):
        client = await db.clients.find_one({"id": order["client_id"]}, {"_id": 0, "name": 1})
        order["client_name"] = client["name"] if client else "Unknown"
    
    return OrderResponse(**order)

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    order_doc = {
        "id": order_id,
        "order_id": generate_order_id(),
        **order.model_dump(),
        "created_at": now
    }
    await db.orders.insert_one(order_doc)
    
    # Update client's last order date and order count
    await db.clients.update_one(
        {"id": order.client_id},
        {"$set": {"last_order_date": now}, "$inc": {"total_orders": 1, "total_revenue": order.amount}}
    )
    
    order_doc["client_name"] = None
    if order.client_id:
        client = await db.clients.find_one({"id": order.client_id}, {"_id": 0, "name": 1})
        order_doc["client_name"] = client["name"] if client else "Unknown"
    
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "_id"})

@api_router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, update: OrderUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if order.get("client_id"):
        client = await db.clients.find_one({"id": order["client_id"]}, {"_id": 0, "name": 1})
        order["client_name"] = client["name"] if client else "Unknown"
    
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

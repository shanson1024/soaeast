# SOA East LLC - CRM Application PRD

## Original Problem Statement
Build a full-stack CRM application for SOA East LLC, a promotional products company with:
- Clean, minimal, modern aesthetic with muted earth-tone palette
- Dashboard with KPIs, charts, and recent deals
- Client management with search, filter, tabs
- Product catalog with category filters
- Order management with status tracking
- Sales Pipeline with Kanban drag-and-drop
- Settings with email and payment integration placeholders
- Brokers management for partner sales tracking

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based auth
- **Libraries**: recharts (charts), @hello-pangea/dnd (drag-drop), date-fns, sonner (toasts)

## User Personas
1. **CEO/President (Scott)** - Full admin access, dashboard overview
2. **Sales Manager** - Client and pipeline management
3. **Account Executive** - Order and deal management
4. **Brokers** - Partners who sell SOA products

## Core Requirements
- [x] JWT Authentication with login/logout
- [x] Auto-seed database with sample data
- [x] Dashboard with KPIs, sales trend charts, pipeline breakdown
- [x] Client management with CRUD, tabs, search, filters
- [x] Product catalog with category filters and cards
- [x] Order management with status tracking and progress bars
- [x] Sales Pipeline with Kanban drag-and-drop
- [x] Settings with email notification toggles
- [x] Payment integration placeholders (Stripe, PayPal)
- [x] Reports page with analytics charts
- [x] Roles & Permissions management
- [x] Brokers management (CRUD, stats, territory tracking)

## What's Been Implemented (Feb 2026)

### Latest: Brokers Feature
- **Backend**: Broker model with fields (name, company, email, phone, territory, commission_rate, status, notes, total_sales, total_deals)
- **API Endpoints**: Full CRUD at `/api/brokers` + `/api/brokers/{id}/record-sale`
- **Frontend**: Complete Brokers.jsx page with:
  - Stats cards (Total Brokers, Active Brokers, Total Sales, Avg Commission)
  - Tabs for filtering (All, Active, Inactive, Pending)
  - Data table with broker details and action buttons
  - Add/Edit modal with form validation
  - Search functionality
- **Navigation**: Added "Brokers" link in sidebar under "Customers" section

### Previous Features
- Full authentication system with JWT tokens
- 6 MongoDB collections: users, clients, products, orders, deals, brokers
- 30+ API endpoints for all CRUD operations
- Dashboard with real-time stats, charts, and Quick Actions widget
- Reports page with analytics (revenue trends, industry breakdown, pipeline charts, top products)
- Responsive sidebar navigation
- Modal forms for creating clients, products, orders, deals, brokers
- Drag-and-drop pipeline with stage transitions
- Roles & permissions management for team members
- Earth-tone design system with DM Sans / Instrument Serif fonts

## Data Models

### Brokers Collection
```json
{
  "id": "uuid",
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "territory": "string",
  "commission_rate": "float",
  "status": "active|inactive|pending",
  "notes": "string",
  "total_sales": "float",
  "total_deals": "int",
  "created_at": "datetime"
}
```

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Login/Auth flow
- [x] Dashboard KPIs
- [x] All CRUD operations
- [x] Quick Actions widget
- [x] Reports page with analytics
- [x] Roles & permissions
- [x] Brokers management

### P1 (High) - Placeholders Ready
- [ ] Email notification integration (UI ready)
- [ ] Payment processing integration (UI ready)
- [ ] Messages section functionality
- [ ] Channels section functionality

### P2 (Future Features)
- [ ] Third-party integrations hub (active)
- [ ] Export to PDF/CSV functionality
- [ ] Email campaign tracking
- [ ] Commission calculations for brokers

## API Endpoints

### Brokers
- `GET /api/brokers` - List all brokers (with optional status/search filters)
- `GET /api/brokers/{id}` - Get single broker
- `POST /api/brokers` - Create broker
- `PUT /api/brokers/{id}` - Update broker
- `DELETE /api/brokers/{id}` - Delete broker
- `POST /api/brokers/{id}/record-sale` - Record a sale for broker

### Other Endpoints
- `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- `/api/clients`, `/api/products`, `/api/orders`, `/api/deals`
- `/api/roles`, `/api/team`
- `/api/dashboard/stats`, `/api/dashboard/pipeline-summary`, `/api/dashboard/sales-trend`

## Test Credentials
- **Email**: scott@soaeast.com
- **Password**: admin123

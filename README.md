# GodownMax — Enterprise Stock Management System

![GodownMax](https://img.shields.io/badge/GodownMax-AI%20Powered-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-blue)

A production-ready, AI-powered inventory and stock management system built with modern technologies.

---

## ✨ Features

- **AI-Powered** — Demand prediction, restock suggestions, sales forecasting, and natural language queries via GodownMax AI
- **Real-Time** — Live stock updates and notifications via Socket.io
- **Multi-Warehouse** — Manage inventory across multiple locations with stock transfers
- **Full Order Management** — Purchase & sales orders with supplier/customer management
- **Reports & Analytics** — Charts, PDF/Excel exports, and AI insights dashboard
- **Role-Based Access** — Admin, Manager, and Staff roles with protected routes
- **Dark/Light Mode** — Full theme support
- **Docker Ready** — One-command deployment

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI |
| State | Zustand, TanStack Query |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| AI | Google Gemini 2.5 Flash |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |
| Export | jsPDF, xlsx |
| Infra | Docker, Nginx |

---

## 📁 Project Structure

```
stockflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full database schema
│   │   └── seed.ts             # Database seeder
│   ├── src/
│   │   ├── config/             # DB connection
│   │   ├── controllers/        # Business logic
│   │   ├── jobs/               # Cron jobs (low stock, expiry)
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/             # All API routes
│   │   ├── sockets/            # Socket.io handler
│   │   └── utils/              # Email, SKU, activity logger
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, forgot/reset password
│   │   │   └── (dashboard)/    # All protected dashboard pages
│   │   ├── components/
│   │   │   ├── dashboard/      # StatsCard, SalesChart, LowStockTable, etc.
│   │   │   ├── products/       # ProductModal
│   │   │   └── shared/         # NotificationBell, Skeleton, Providers
│   │   ├── hooks/              # useAuthGuard
│   │   ├── lib/                # axios api client, utils
│   │   └── store/              # Zustand auth store
│   ├── Dockerfile
│   └── package.json
├── docker/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Google Gemini API key

### 1. Clone and install

```bash
git clone https://github.com/yourorg/stockflow.git
cd stockflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local — NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Set up the database

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with demo data
npx ts-node prisma/seed.ts
```

### 4. Start development servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@stockflow.com | Admin@123 |
| Manager | manager@stockflow.com | Manager@123 |
| Staff | staff@stockflow.com | Staff@123 |

---

## 🐳 Docker Deployment

```bash
# Copy root env file
cp backend/.env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up --build -d

# Run migrations inside container
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx ts-node prisma/seed.ts

# View logs
docker-compose logs -f
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs
- Via Nginx: http://localhost:80

---

## ☁️ Production Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root directory to `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`
6. Add a **PostgreSQL** database on Render and copy the connection string

### Frontend → Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-render-backend.onrender.com
   ```
5. Deploy

---

## 📡 API Documentation

Full Swagger docs available at: `http://localhost:5000/api/docs`

### Key Endpoints

```
POST   /api/auth/register           Register new user
POST   /api/auth/login              Login
POST   /api/auth/refresh            Refresh token
POST   /api/auth/forgot-password    Send reset email
POST   /api/auth/reset-password     Reset password

GET    /api/dashboard/stats         Dashboard statistics
GET    /api/dashboard/revenue       Revenue analytics

GET    /api/products                List products (search, filter, paginate)
POST   /api/products                Create product
PUT    /api/products/:id            Update product
DELETE /api/products/:id            Soft-delete product
POST   /api/products/bulk-import    Import from Excel
GET    /api/products/export         Export to Excel
GET    /api/products/:id/qr         Generate QR code

GET    /api/inventory               List inventory items
POST   /api/inventory/adjust        Adjust stock level
POST   /api/inventory/transfer      Transfer between warehouses

GET    /api/orders                  List orders
POST   /api/orders                  Create order
PUT    /api/orders/:id/status       Update order status

POST   /api/ai/chat                 AI chatbot
POST   /api/ai/demand-prediction    Predict demand for product
GET    /api/ai/restock-suggestions  AI restock recommendations
GET    /api/ai/sales-forecast       Sales forecasting
POST   /api/ai/query                Natural language query
GET    /api/ai/inventory-optimization  Inventory optimization

GET    /api/reports/sales           Sales report
GET    /api/reports/inventory       Inventory report

GET    /api/notifications           User notifications
PUT    /api/notifications/read-all  Mark all as read
```

---

## 🔒 Security

- **Helmet** — HTTP security headers
- **CORS** — Configurable origin whitelist
- **Rate Limiting** — 500 requests per 15 minutes per IP
- **JWT** — Short-lived access tokens (15min) + refresh tokens (7 days)
- **Bcrypt** — Password hashing with cost factor 12
- **Zod** — Input validation on all routes
- **Prisma** — Parameterized queries (SQL injection protection)

---

## 🤖 AI Features

All AI features require a valid `GEMINI_API_KEY`.

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Chat Assistant | `POST /api/ai/chat` | Conversational inventory Q&A |
| Demand Prediction | `POST /api/ai/demand-prediction` | Predict demand for a product |
| Restock Suggestions | `GET /api/ai/restock-suggestions` | Prioritized reorder list |
| Sales Forecast | `GET /api/ai/sales-forecast` | Revenue forecasting |
| NL Query | `POST /api/ai/query` | Natural language analytics |
| Optimization | `GET /api/ai/inventory-optimization` | ABC analysis + savings |

---

## 📊 Database Schema

The Prisma schema includes 14 models:

- **User** — Authentication and roles
- **Product** — SKU, pricing, thresholds, images
- **Category** — Hierarchical product categories
- **InventoryItem** — Stock per product per warehouse
- **Warehouse** — Multi-location support
- **StockMovement** — Full audit trail of all stock changes
- **BatchLot** — Batch tracking with expiry dates
- **Supplier** — Vendor management
- **Customer** — Customer records
- **Order** + **OrderItem** — Purchase and sales orders
- **Notification** — In-app and email alerts
- **ActivityLog** — System audit log
- **AIReport** — AI query history and results
- **SystemSetting** — Key-value config store

---

## 🔄 Background Jobs (Cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| Low stock check | Every hour | Creates alerts and sends email |
| Expiry alerts | Daily 8 AM | Warns of batches expiring in 7 days |
| Notification cleanup | Weekly | Removes read notifications older than 90 days |

---

## 📝 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32-char secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Min 32-char secret for refresh tokens |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS |
| `SMTP_HOST` | ⬜ | SMTP server for email alerts |
| `SMTP_USER` | ⬜ | SMTP username |
| `SMTP_PASS` | ⬜ | SMTP password / app password |
| `CLOUDINARY_*` | ⬜ | Cloudinary for image uploads |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Socket.io server URL |

---

## 🧪 Testing

```bash
# Backend unit/API tests
cd backend && npm test

# Frontend (add Jest or Playwright)
cd frontend && npm test
```

---

## 📄 License

MIT © 2024 StockFlow AI

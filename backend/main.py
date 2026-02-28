"""
main.py
-------
BizSolve API entry point.
Registers all routers, configures CORS, and sets up the FastAPI app.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all route modules
from routes.auth_routes import router as auth_router
from routes.business_routes import router as business_router
from routes.product_routes import router as product_router
from routes.website_routes import router as website_routes
from routes.campaign_routes import router as campaign_router
from routes.asset_routes import router as asset_router
from routes.poster_routes import router as poster_router
from routes.customer_routes import router as customer_router
from routes.chatlog_routes import router as chatlog_router
from routes.chat_routes import router as chat_router          # ← NEW
from routes.admin_routes import router as admin_router


# ---------------------------------------------------------------------------
# App initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BizSolve API",
    description=(
        "AI-powered business toolkit backend.\n\n"
        "Provides authentication, business management, products, websites, "
        "campaigns, posters, brand vault, chatbot logs, and admin analytics."
    ),
    version="1.0.0",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
)

# ---------------------------------------------------------------------------
# CORS Middleware
# Update allow_origins in production to only allow your frontend domain(s).
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # TODO: Lock down in production e.g. ["https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)         # /auth/*
app.include_router(business_router)     # /business/*
app.include_router(product_router)      # /products/*
app.include_router(website_routes)      # /websites/*
app.include_router(campaign_router)     # /campaigns/*
app.include_router(asset_router)        # /assets/*
app.include_router(poster_router)       # /posters/*
app.include_router(customer_router)     # /customers/*
app.include_router(chatlog_router)      # /chatlogs/*
app.include_router(chat_router)         # /chat/*   ← NEW
app.include_router(admin_router)        # /admin/*

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "BizSolve API is running 🚀"}
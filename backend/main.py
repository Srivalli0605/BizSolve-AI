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
from routes.chat_routes import router as chat_router
from routes.admin_routes import router as admin_router
from routes.brandvault_routes import router as brandvault_router  # ← NEW

from database import get_database


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
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # TODO: Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup — create indexes
# ---------------------------------------------------------------------------

@app.on_event("startup")
def create_indexes():
    db = get_database()

    # BrandVault — one vault per business
    db["brandvault"].create_index("business_id", unique=True)

    # Brand Assets — filter by business + category
    db["brand_assets"].create_index("business_id")
    db["brand_assets"].create_index([("business_id", 1), ("category", 1)])

    # Brand Content — filter by business
    db["brand_content"].create_index("business_id")

    # Chatlogs — filter by business, sorted by time
    db["chatlogs"].create_index([("business_id", 1), ("timestamp", -1)])


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
app.include_router(chat_router)         # /chat/*
app.include_router(admin_router)        # /admin/*
app.include_router(brandvault_router)   # /brandvault/*  ← NEW


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "BizSolve API is running 🚀"}
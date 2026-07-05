from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .config import CORS_ORIGINS
from .routers import field_types, forms, fields, links, public

app = FastAPI(
    title="Low-Code Dynamic Form Platform API",
    description="Milestone 1: Form Schema Engine, Field Type Library & Core CRUD APIs",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(field_types.router)
app.include_router(forms.router)
app.include_router(fields.router)
app.include_router(links.router)
app.include_router(public.router)

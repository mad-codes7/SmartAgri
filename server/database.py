"""
SmartAgri AI - Database Configuration
SQLAlchemy async engine and session management.
Supports both SQLite (local dev) and PostgreSQL (production).
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()

# ── Build engine kwargs based on database backend ──────────
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

_engine_kwargs = dict(
    echo=settings.DEBUG,
    future=True,
)

if not _is_sqlite:
    # PostgreSQL pool settings for production
    _engine_kwargs.update(
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,       # detect stale connections
        pool_recycle=300,          # recycle connections every 5 min
    )

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency to get async database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# Create the async engine
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

# Create a session maker
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for our models
Base = declarative_base()


# Dependency to get a DB session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.pismo import Pismo
from app.schemas.pismo import PismoCreate, PismoUpdate


class PismoRepository(BaseRepository[Pismo, PismoCreate, PismoUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> list[Pismo]:
        statement = (
            select(self.model)
            .where(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(statement)
        return result.scalars().all()

    async def get_with_details(self, db: AsyncSession, id: int) -> Pismo | None:
        """Get a Pismo with its related analizy and opcje."""
        statement = (
            select(self.model)
            .where(self.model.id == id)
            .options(selectinload(self.model.analizy).selectinload("opcje"))
        )
        result = await db.execute(statement)
        return result.scalar_one_or_none()


    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: PismoCreate, owner_id: int
    ) -> Pismo:
        """Create a new pismo and assign it to an owner."""
        db_obj = self.model(**obj_in.dict(), owner_id=owner_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


pismo_repo = PismoRepository(Pismo)

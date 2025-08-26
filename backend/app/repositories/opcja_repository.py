from app.repositories.base import BaseRepository
from app.models.opcja import Opcja
from app.schemas.opcja import OpcjaCreate, OpcjaUpdate


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.repositories.base import BaseRepository
from app.models.opcja import Opcja
from app.schemas.opcja import OpcjaCreate, OpcjaUpdate


class OpcjaRepository(BaseRepository[Opcja, OpcjaCreate, OpcjaUpdate]):
    async def get_with_owner_info(self, db: AsyncSession, *, id: int) -> Opcja | None:
        """
        Get an Opcja and eagerly load the related Analiza and Pismo
        to check for ownership.
        """
        statement = (
            select(self.model)
            .where(self.model.id == id)
            .options(selectinload(self.model.analiza).selectinload("pismo"))
        )
        result = await db.execute(statement)
        return result.scalar_one_or_none()


opcja_repo = OpcjaRepository(Opcja)

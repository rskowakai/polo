from app.repositories.base import BaseRepository
from app.models.analiza import Analiza
from app.schemas.analiza import AnalizaCreate, AnalizaUpdate


from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analiza import Analiza
from app.schemas.analiza import AnalizaCreate


class AnalizaRepository(BaseRepository[Analiza, AnalizaCreate, AnalizaUpdate]):
    async def create_with_admin(
        self, db: AsyncSession, *, obj_in: AnalizaCreate, admin_id: int
    ) -> Analiza:
        """Create a new analiza and assign it to an admin."""
        db_obj = self.model(**obj_in.dict(), admin_id=admin_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


analiza_repo = AnalizaRepository(Analiza)

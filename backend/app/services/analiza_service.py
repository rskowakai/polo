from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories import analiza_repo, pismo_repo
from app.schemas import AnalizaCreate
from app.models import User, UserRole


class AnalizaService:
    async def create_analiza(
        self, db: AsyncSession, *, admin_user: User, obj_in: AnalizaCreate
    ):
        if admin_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ADMIN role can create an Analiza.",
            )

        pismo = await pismo_repo.get(db, id=obj_in.pismo_id)
        if not pismo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pismo with id {obj_in.pismo_id} not found.",
            )

        # Similar to Pismo, we need a way to pass the admin_id
        # Let's add a create_with_admin method to the AnalizaRepository
        return await analiza_repo.create_with_admin(
            db, obj_in=obj_in, admin_id=admin_user.id
        )


analiza_service = AnalizaService()

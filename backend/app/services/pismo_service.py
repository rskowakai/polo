from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories import pismo_repo
from app.schemas import PismoCreate
from app.models import User, UserRole


class PismoService:
    async def create_pismo(self, db: AsyncSession, *, user: User, obj_in: PismoCreate):
        if user.role != UserRole.CLIENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only CLIENT role can create a Pismo.",
            )

        # Pass owner_id directly to the repository create method
        # The base repository expects a schema, so we need to adapt
        # Let's create a custom create method in the repository for this
        return await pismo_repo.create_with_owner(db, obj_in=obj_in, owner_id=user.id)

    async def get_pismo(self, db: AsyncSession, *, user: User, pismo_id: int):
        pismo = await pismo_repo.get_with_details(db, id=pismo_id)
        if not pismo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pismo not found")

        if user.role == UserRole.CLIENT and pismo.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this Pismo.",
            )
        return pismo


pismo_service = PismoService()

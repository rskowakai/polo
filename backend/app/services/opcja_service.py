from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories import opcja_repo
from app.models import User, UserRole


class OpcjaService:
    async def purchase_opcja(
        self, db: AsyncSession, *, user: User, opcja_id: int
    ):
        if user.role != UserRole.CLIENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only CLIENT role can purchase an Opcja.",
            )

        opcja = await opcja_repo.get(db, id=opcja_id)
        if not opcja:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opcja with id {opcja_id} not found.",
            )

        # To check ownership, we need to traverse up to the Pismo
        # This requires loading the relationships.
        # We need to enhance the opcja_repo.get method or add a new one.
        opcja_with_owner = await opcja_repo.get_with_owner_info(db, id=opcja_id)

        if opcja_with_owner.analiza.pismo.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only purchase options related to your own Pismo.",
            )

        if opcja.is_purchased:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This option has already been purchased.",
            )

        updated_opcja = await opcja_repo.update(
            db, db_obj=opcja, obj_in={"is_purchased": True}
        )
        return updated_opcja


opcja_service = OpcjaService()

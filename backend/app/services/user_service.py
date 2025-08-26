from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories import user_repo
from app.schemas import UserCreate
from app.models import User
from app.core.security import get_password_hash


class UserService:
    async def create_user(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """
        Create a new user.
        """
        db_user = await user_repo.get_by_email(db, email=obj_in.email)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists in the system.",
            )

        hashed_password = get_password_hash(obj_in.password)
        db_obj = await user_repo.create(
            db, obj_in=UserCreate(
                email=obj_in.email,
                password=hashed_password,
                role=obj_in.role
            )
        )
        return db_obj

user_service = UserService()

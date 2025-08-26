from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories import user_repo
from app.core.security import verify_password
from app.models.user import User


class AuthService:
    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> User:
        """
        Authenticate a user.
        """
        user = await user_repo.get_by_email(db, email=email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        return user


auth_service = AuthService()

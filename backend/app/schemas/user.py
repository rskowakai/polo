from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    email: EmailStr


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CLIENT


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: str | None = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    role: UserRole

    class Config:
        orm_mode = True


# Properties to return to client
class User(UserInDBBase):
    pass


# Properties stored in DB
class UserInDB(UserInDBBase):
    password: str

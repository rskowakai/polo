from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


# Shared properties
class OpcjaBase(BaseModel):
    description: str
    price: Decimal


# Properties to receive on creation
class OpcjaCreate(OpcjaBase):
    analiza_id: int


# Properties to receive on update
class OpcjaUpdate(BaseModel):
    is_purchased: Optional[bool] = None
    realization_details: Optional[str] = None


# Properties shared by models in DB
class OpcjaInDBBase(OpcjaBase):
    id: int
    analiza_id: int
    is_purchased: bool
    realization_details: Optional[str] = None

    class Config:
        orm_mode = True


# Properties to return to client
class Opcja(OpcjaInDBBase):
    pass


# Properties stored in DB
class OpcjaInDB(OpcjaInDBBase):
    pass

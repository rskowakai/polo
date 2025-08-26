from sqlalchemy import Column, Integer, ForeignKey, Text, Numeric, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Opcja(Base):
    __tablename__ = "opcje"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    is_purchased = Column(Boolean, default=False, nullable=False)
    realization_details = Column(Text, nullable=True)

    analiza_id = Column(Integer, ForeignKey("analizy.id"), nullable=False)
    analiza = relationship("Analiza", back_populates="opcje")

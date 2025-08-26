from .user import User, UserRole
from .pismo import Pismo, PismoStatus
from .analiza import Analiza
from .opcja import Opcja

# This allows Alembic to see the models
from app.core.database import Base

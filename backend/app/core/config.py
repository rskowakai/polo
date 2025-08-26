from pydantic import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_ALGORITHM: str = "HS256"

    class Config:
        # This will automatically load variables from a .env file
        # if it exists. We use .env.example as a template.
        env_file = ".env"


settings = Settings()

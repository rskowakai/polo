from fastapi import FastAPI

app = FastAPI(title="Auth Service")

@app.get("/health", tags=["Health"])
async def health_check():
    """Checks the health of the service."""
    return {"status": "ok"}

from fastapi import FastAPI

app = FastAPI(title="AI Analysis Service")

@app.get("/health", tags=["Health"])
async def health_check():
    """Checks the health of the service."""
    return {"status": "ok"}

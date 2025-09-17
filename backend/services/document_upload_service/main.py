# main.py - główna aplikacja FastAPI dla Document Upload Service

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
import os
import uuid
import boto3  # Dla S3/MinIO
from botocore.exceptions import ClientError
from datetime import datetime

# --- Konfiguracja ---
# W rzeczywistej aplikacji te wartości byłyby w zmiennych środowiskowych
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")  # MinIO
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "documents")
MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"]

app = FastAPI(
    title="Document Upload Service",
    description="API for handling document uploads and storage.",
    version="1.0.0"
)

# Inicjalizacja klienta S3
s3_client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT_URL,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY
)

# Pydantic models for request/response validation
class UploadResponse(BaseModel):
    document_id: str = Field(..., example="a1b2c3d4-e5f6-7890-1234-567890abcdef")
    filename: str = Field(..., example="my_legal_letter.pdf")
    storage_url: str = Field(..., example=f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/a1b2c3d4-e5f6-7890-1234-567890abcdef.pdf")
    message: str = Field(..., example="Document uploaded successfully.")

class ErrorResponse(BaseModel):
    detail: str = Field(..., example="Invalid file type.")

# --- Helper Functions ---
def create_s3_bucket_if_not_exists():
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
            print(f"Bucket '{S3_BUCKET_NAME}' created.")
        else:
            raise

@app.on_event("startup")
async def startup_event():
    create_s3_bucket_if_not_exists()

# --- API Endpoints ---
@app.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}}
)
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads a document for analysis.
    Supports PDF, JPG, PNG files.
    """
    # Check file size first
    # Workaround for file size check as file.size is not available for SpooledTemporaryFile before reading
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB"
        )

    # Reset file pointer after reading
    await file.seek(0)

    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    document_id = str(uuid.uuid4())
    object_name = f"{document_id}.{file_extension}"

    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=object_name, Body=file_content, ContentType=file.content_type)

        storage_url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{object_name}"

        # TODO: Zapisz metadane dokumentu do PostgreSQL
        # np. db.save_document(document_id, user_id, file.filename, storage_url, file.content_type)

        # TODO: Wyślij zdarzenie do kolejki komunikatów dla AI Analysis Service
        # np. await message_queue.publish({"document_id": document_id, "storage_url": storage_url})

        return UploadResponse(
            document_id=document_id,
            filename=file.filename,
            storage_url=storage_url,
            message="Document uploaded successfully."
        )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

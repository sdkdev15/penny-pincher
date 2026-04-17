import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import shutil

from utils.ocr_processor import scan_receipt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Receipt Scan API", version="1.0.0")

# Upload directory
UPLOAD_DIR = "/tmp/receipts"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ScanResponse(BaseModel):
    success: bool
    text: str
    data: dict
    error: Optional[str] = None


@app.get("/")
def root():
    return {
        "service": "Receipt Scan API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/scan", response_model=ScanResponse)
async def scan_receipt_endpoint(file: UploadFile = File(...)):
    """
    Scan a receipt image and extract text using OCR.
    Supports Indonesian and English languages.
    
    Accepted formats: jpg, jpeg, png, bmp, tiff
    """
    # Validate file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Processing receipt: {file.filename}")
        
        # Run OCR
        result = scan_receipt(file_path)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return ScanResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scan-text")
async def scan_receipt_text(file: UploadFile = File(...)):
    """
    Alternative endpoint that returns only the raw OCR text.
    """
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result = scan_receipt(file_path)
        os.remove(file_path)
        
        return {"text": result.get('text', ''), 'success': result['success']}
        
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
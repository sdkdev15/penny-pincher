# Receipt Scan Service

A lightweight OCR service for scanning Indonesian shopping receipts using Tesseract OCR.

## Features

- **Indonesian Language Support**: Uses Tesseract OCR with Indonesian (`ind`) and English (`eng`) language models
- **Receipt Data Extraction**: Automatically extracts:
  - Store name
  - Date
  - Total amount
  - Line items
- **Lightweight**: Built with Python FastAPI and Tesseract OCR (no heavy ML models)
- **Docker-ready**: Includes Dockerfile and docker-compose configuration

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{"status": "healthy"}`

### Scan Receipt
```
POST /scan
Content-Type: multipart/form-data

Parameters:
- file: Image file (jpg, jpeg, png, bmp, tiff)
```

Response:
```json
{
  "success": true,
  "text": "Raw OCR text output",
  "data": {
    "store_name": "Store Name",
    "date": "DD/MM/YYYY",
    "items": ["Item 1", "Item 2"],
    "total": "Rp 100.000",
    "raw_text": "Full extracted text"
  }
}
```

## Running the Service

### Using Docker Compose
```bash
docker-compose up -d receipt-scan
```

The service will be available at `http://localhost:8000`

### Local Development
```bash
cd receipt-scan
pip install -r requirements.txt
python app.py
```

## Testing

Test the service with curl:
```bash
curl -X POST "http://localhost:8000/scan" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@receipt.jpg"
```

## Technology Stack

- **Python 3.11**
- **FastAPI** - Web framework
- **Tesseract OCR 5.5** - OCR engine
- **pytesseract** - Python wrapper
- **Pillow** - Image processing

## Indonesian Language Support

The service downloads the Indonesian language data (`ind.traineddata`) from the Tesseract OCR repository during build. This provides support for Indonesian text commonly found on local receipts.

## Integration with Next.js App

The Next.js app communicates with this service via:
- URL: `http://receipt-scan:8000` (Docker) or `http://localhost:8000` (local)
- Endpoint: `POST /scan`

See: `src/app/api/process/receipts/scan/route.ts`
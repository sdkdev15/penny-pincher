import pytesseract
from PIL import Image
import re
from typing import Dict, List, Any
import logging
import os

logger = logging.getLogger(__name__)

# Set Tesseract data path
os.environ['TESSDATA_PREFIX'] = '/usr/share/tessdata'


def extract_numbers(text: str) -> List[str]:
    """Extract numbers from text (for prices, quantities, etc.)"""
    # Match Indonesian number format (with . as thousand separator and , as decimal)
    pattern = r'\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+'
    return re.findall(pattern, text)


def parse_receipt_data(text: str) -> Dict[str, Any]:
    """Parse receipt text to extract relevant data"""
    lines = text.strip().split('\n')
    
    result = {
        'store_name': None,
        'date': None,
        'items': [],
        'total': None,
        'raw_text': text
    }
    
    # Try to find store name (first non-empty line)
    for line in lines[:5]:
        line = line.strip()
        if line and len(line) > 3:
            result['store_name'] = line
            break
    
    # Look for date patterns (Indonesian format: DD/MM/YYYY or DD-MM-YYYY)
    date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
    for line in lines:
        match = re.search(date_pattern, line)
        if match:
            result['date'] = match.group()
            break
    
    # Look for total patterns
    total_patterns = [
        r'[Tt]otal[:\s]*([Rp\s]*[\d.,]+)',
        r'[Tt]otal[Bb]ayar[:\s]*([Rp\s]*[\d.,]+)',
        r'[Ss]ubtotal[:\s]*([Rp\s]*[\d.,]+)',
        r'Grand[Tt]otal[:\s]*([Rp\s]*[\d.,]+)'
    ]
    
    for pattern in total_patterns:
        match = re.search(pattern, text)
        if match:
            result['total'] = match.group(1).strip()
            break
    
    # Extract items (simplified - look for lines with numbers)
    for line in lines:
        line = line.strip()
        if line and re.search(r'\d', line):
            # Skip lines that look like dates or totals
            if not re.search(date_pattern, line) and not re.search(r'[Tt]otal', line):
                result['items'].append(line)
    
    return result


def scan_receipt(image_path: str) -> Dict[str, Any]:
    """
    Scan receipt image and extract text using Tesseract OCR
    Supports Indonesian (ind) and English (eng) languages
    """
    try:
        # Open image
        img = Image.open(image_path)
        
        # Run OCR with Indonesian and English language support
        # Using psm 6 for uniform block of text (good for receipts)
        text = pytesseract.image_to_string(
            img,
            lang='ind+eng',
            config='--psm 6 --oem 3'
        )
        
        logger.info(f"OCR completed. Extracted {len(text)} characters")
        
        # Parse the extracted text
        parsed_data = parse_receipt_data(text)
        
        return {
            'success': True,
            'text': text,
            'data': parsed_data
        }
        
    except Exception as e:
        logger.error(f"OCR error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'data': {}
        }
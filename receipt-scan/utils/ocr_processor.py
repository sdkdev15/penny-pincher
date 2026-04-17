import pytesseract
from PIL import Image
import cv2
import numpy as np
import re
from typing import Dict, List, Any, Tuple, Optional
import logging
import os
import tempfile

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    easyocr = None

logger = logging.getLogger(__name__)

# Set Tesseract data path
os.environ['TESSDATA_PREFIX'] = '/usr/share/tessdata'


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Preprocess receipt image for better OCR accuracy.
    Handles common issues with scanned documents.
    """
    # Read image with OpenCV
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Check if image is already very dark or very light
    mean_brightness = np.mean(gray)
    
    # Apply adaptive histogram equalization for better contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, None, h=10, templateWindowSize=7)
    
    # Sharpen
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    
    # Apply adaptive thresholding (Otsu's method works well for receipts)
    _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Optional: Resize for better OCR
    height, width = binary.shape
    if height < 800:
        scale = 800 / height
        binary = cv2.resize(binary, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Convert back to PIL Image
    processed_img = Image.fromarray(binary)
    
    return processed_img


def preprocess_multiple_methods(image_path: str) -> List[Tuple[str, Image.Image]]:
    """
    Generate multiple preprocessed versions for best OCR results.
    Tries different preprocessing methods and returns them all.
    """
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    results = []
    
    # Method 1: Grayscale + CLAHE + Otsu
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('clahe_otsu', Image.fromarray(binary)))
    
    # Method 2: Grayscale + Histogram Equalization + Binary
    hist_eq = cv2.equalizeHist(gray)
    _, binary2 = cv2.threshold(hist_eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('hist_eq', Image.fromarray(binary2)))
    
    # Method 3: Denoised + High Gamma (for dark receipts)
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7)
    _, binary3 = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('denoised', Image.fromarray(binary3)))
    
    # Method 4: Original grayscale (just in case)
    results.append(('original_gray', Image.fromarray(gray)))
    
    # Method 5: Inverted (for receipts with dark background)
    inverted = cv2.bitwise_not(gray)
    _, inv_binary = cv2.threshold(inverted, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('inverted', Image.fromarray(inv_binary)))
    
    # Resize all to reasonable size for OCR
    resized_results = []
    for method_name, pil_img in results:
        w, h = pil_img.size
        if h < 800:
            scale = 800 / h
            new_size = (int(w * scale), int(h * scale))
            pil_img = pil_img.resize(new_size, Image.LANCZOS)
        resized_results.append((method_name, pil_img))
    
    return resized_results


def extract_text_with_config(img: Image.Image, config: str) -> str:
    """Extract text with specific Tesseract configuration"""
    try:
        return pytesseract.image_to_string(
            img,
            lang='ind+eng',
            config=config
        )
    except Exception as e:
        logger.warning(f"Tesseract error with config '{config}': {e}")
        return ""


def extract_text_easyocr(image_path: str) -> str:
    """Extract text using EasyOCR for better accuracy"""
    if not EASYOCR_AVAILABLE:
        logger.warning("EasyOCR not available, skipping")
        return ""
    
    try:
        reader = easyocr.Reader(['en', 'id'], gpu=False)  # Use CPU for compatibility
        results = reader.readtext(image_path, detail=0)
        return '\n'.join(results)
    except Exception as e:
        logger.warning(f"EasyOCR error: {e}")
        return ""


def scan_receipt_with_best_method(image_path: str) -> Dict[str, Any]:
    """
    Try multiple preprocessing methods and select the best OCR result.
    Uses multiple page segmentation modes and preprocessing techniques.
    """
    try:
        # Generate multiple preprocessed versions
        preprocessed_versions = preprocess_multiple_methods(image_path)
        
        # Define different PSM configurations to try
        psm_configs = [
            '--psm 6',  # Uniform block of text (good for receipts)
            '--psm 4',  # Single column
            '--psm 3',  # Fully automatic page segmentation
            '--psm 11', # Sparse text
            '--psm 12', # Sparse text in reading order
        ]
        
        all_results = []
        
        for method_name, img in preprocessed_versions:
            for psm_config in psm_configs:
                text = extract_text_with_config(img, f'{psm_config} --oem 3')
                if text.strip():
                    # Score the result based on:
                    # 1. Presence of known receipt keywords
                    # 2. Number of detected prices
                    # 3. Text length
                    score = score_ocr_result(text)
                    all_results.append({
                        'method': f'{method_name}_{psm_config}',
                        'text': text,
                        'score': score
                    })
        
        # Also try EasyOCR on original image
        if EASYOCR_AVAILABLE:
            easyocr_text = extract_text_easyocr(image_path)
            if easyocr_text.strip():
                score = score_ocr_result(easyocr_text)
                all_results.append({
                    'method': 'easyocr_original',
                    'text': easyocr_text,
                    'score': score
                })
        
        # Sort by score (highest first)
        all_results.sort(key=lambda x: x['score'], reverse=True)
        
        # Return the best result
        if all_results:
            best = all_results[0]
            logger.info(f"Best OCR method: {best['method']} with score {best['score']}")
            return {
                'success': True,
                'text': best['text'],
                'method': best['method'],
                'data': parse_receipt_data(best['text'])
            }
        else:
            # Fallback to simple preprocessing
            logger.warning("All methods failed, using fallback")
            return scan_receipt_simple(image_path)
            
    except Exception as e:
        logger.error(f"Multi-method OCR error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'method': 'error',
            'data': {}
        }


def score_ocr_result(text: str) -> float:
    """
    Score OCR result based on quality indicators.
    Higher score = better result.
    """
    score = 0.0
    
    # Known receipt keywords (Indonesian and English)
    keywords = [
        'total', 'subtotal', 'grand total', 'jumlah', 'qty', 'quantity',
        'harga', 'rp', 'rpp', 'Rp', 'Rpp', 'tunai', 'cash', 'kembalian',
        'pajak', 'tax', 'disc', 'diskon', 'item', 'barang', 'transaksi',
        'tanggal', 'date', 'kasir', 'cashier', 'struk', 'receipt'
    ]
    
    text_lower = text.lower()
    
    # Count keyword matches
    for keyword in keywords:
        if keyword in text_lower:
            score += 2
    
    # Count price patterns (Rp XX.XXX or XX.XXX)
    price_patterns = [
        r'rp\s*\d{1,3}(?:\.\d{3})+',  # Rp 1.000.000
        r'rp\s*\d+',                   # Rp 1000
        r'\d{1,3}(?:\.\d{3})+(?:,00?)?',  # 1.000.000 or 1.000.000,00
    ]
    
    for pattern in price_patterns:
        matches = re.findall(pattern, text_lower)
        score += len(matches) * 3  # Prices are important
    
    # Count lines (more lines often means more complete)
    lines = [l for l in text.split('\n') if l.strip()]
    score += len(lines) * 0.5
    
    # Penalize for too many garbled characters
    if len(text) > 0:
        # Check for excessive non-alphanumeric characters
        non_alpha = sum(1 for c in text if not c.isalnum() and c not in ' \n\t.,:;-')
        non_alpha_ratio = non_alpha / len(text)
        if non_alpha_ratio > 0.5:
            score -= 10  # Heavy penalty for garbled text
    
    # Bonus for having both item names and prices
    has_items = bool(re.search(r'[a-zA-Z]{3,}', text))  # Has text words
    has_prices = bool(re.search(r'\d', text))  # Has numbers
    if has_items and has_prices:
        score += 5
    
    return score


def scan_receipt_simple(image_path: str) -> Dict[str, Any]:
    """
    Simple OCR scan with basic preprocessing (fallback method).
    """
    try:
        # Open and preprocess image
        processed_img = preprocess_image(image_path)
        
        # Run OCR
        text = pytesseract.image_to_string(
            processed_img,
            lang='ind+eng',
            config='--psm 6 --oem 3'
        )
        
        logger.info(f"Simple OCR completed. Extracted {len(text)} characters")
        
        return {
            'success': True,
            'text': text,
            'method': 'simple',
            'data': parse_receipt_data(text)
        }
        
    except Exception as e:
        logger.error(f"Simple OCR error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'method': 'simple_error',
            'data': {}
        }


def scan_receipt(image_path: str) -> Dict[str, Any]:
    """
    Main entry point for receipt scanning.
    Uses multi-method approach for best accuracy.
    """
    return scan_receipt_with_best_method(image_path)


def parse_receipt_data(text: str) -> Dict[str, Any]:
    """Parse receipt text to extract relevant data"""
    lines = text.strip().split('\n')
    
    result = {
        'store_name': None,
        'date': None,
        'items': [],
        'total': None,
        'subtotal': None,
        'tax': None,
        'payment_method': None,
        'cashier': None,
        'transaction_id': None,
        'raw_text': text
    }
    
    # Try to find store name (first non-empty line with mostly letters)
    for line in lines[:10]:
        line = line.strip()
        if line and len(line) > 2:
            # Check if line is mostly letters (likely store name)
            alpha_count = sum(1 for c in line if c.isalpha())
            if alpha_count / len(line) > 0.5:
                result['store_name'] = line
                break
    
    # Look for date patterns (Indonesian format)
    date_patterns = [
        r'\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}',  # 17/04/2026 or 17.04.2026
        r'\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}',      # 2026-04-17
        r'\d{1,2}\s+(?:jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\w*\s+\d{2,4}',  # 17 April 2026
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['date'] = match.group()
            break
    
    # Look for transaction ID
    trans_patterns = [
        r'[Nn]o\.?\s*[:]?\s*([A-Z0-9]{5,})',
        r'[Tt]rans\.?\s*[:]?\s*([A-Z0-9]{5,})',
        r'[Ff]aktur\.?\s*[:]?\s*([A-Z0-9]{5,})',
    ]
    
    for pattern in trans_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['transaction_id'] = match.group(1)
            break
    
    # Look for cashier name
    cashier_patterns = [
        r'[Kk]asir\s*[:]?\s*([A-Za-z\s]+?)(?:\n|$)',
        r'[Cc]ashier\s*[:]?\s*([A-Za-z\s]+?)(?:\n|$)',
    ]
    
    for pattern in cashier_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['cashier'] = match.group(1).strip()
            break
    
    # Look for totals with better patterns
    total_patterns = [
        r'[Tt]otal\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'[Tt]otal\s*[Bb]ayar\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'[Gg]rand\s*[Tt]otal\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'[Jj]umlah\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'(?:^|\n)\s*(\d{1,3}(?:[.,]\d{3}){2,})\s*(?:$|\n)',  # Standalone large number
    ]
    
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['total'] = match.group(1).strip()
            break
    
    # Look for subtotal
    subtotal_patterns = [
        r'[Ss]ub\s*[Tt]otal\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'[Ss]ubtotal\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
    ]
    
    for pattern in subtotal_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['subtotal'] = match.group(1).strip()
            break
    
    # Look for tax/pajak
    tax_patterns = [
        r'[Pp]ajak\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
        r'[Tt]ax\s*[:.\-]*\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',
    ]
    
    for pattern in tax_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['tax'] = match.group(1).strip()
            break
    
    # Extract items with better pattern matching
    # Look for lines with item name + quantity/price
    item_patterns = [
        r'([A-Za-z\s]+?)\s+(\d+)\s*[xX]\s*[Rr]p?\s*(\d{1,3}(?:[.,]\d{3})*)',  # Item 2 x Rp1000
        r'([A-Za-z\s]+?)\s+(\d+)\s*([Kk][Gg]|[Pp][Aa][Cc][Kk]|[Bb][Uu][Hh])',  # Item 2 Pack
        r'([A-Za-z\s]+?)\s+(\d{1,3}(?:[.,]\d{3})+)',  # Item 10.000
    ]
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue
        
        # Skip header/footer lines
        if any(skip in line.lower() for skip in ['terima kasih', 'thank', 'struk', 'receipt', '===', '----', 'www.']):
            continue
        
        for pattern in item_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                groups = match.groups()
                item = {
                    'name': groups[0].strip(),
                    'raw': line
                }
                if len(groups) > 1:
                    item['quantity'] = groups[1].strip()
                if len(groups) > 2:
                    item['price'] = groups[2].strip()
                
                # Avoid duplicates
                if item not in result['items']:
                    result['items'].append(item)
                break
    
    return result
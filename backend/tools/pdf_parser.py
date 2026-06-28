import os
import fitz # PyMuPDF
import pdfplumber
import docx
from backend.config import logger

def extract_text_from_pdf(filepath: str) -> str:
    text = ""
    try:
        # Primary: PyMuPDF
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text()
        doc.close()
        
        # Fallback to pdfplumber if empty text extracted
        if not text.strip():
            logger.info(f"PyMuPDF extracted empty text. Falling back to pdfplumber for {filepath}")
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
    except Exception as e:
        logger.error(f"Error parsing PDF file {filepath}: {e}")
        # Try pdfplumber directly
        try:
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
        except Exception as ex:
            logger.error(f"pdfplumber fallback also failed for {filepath}: {ex}")
            
    return text

def extract_text_from_docx(filepath: str) -> str:
    text = ""
    try:
        doc = docx.Document(filepath)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        logger.error(f"Error parsing DOCX file {filepath}: {e}")
    return text

def extract_raw_resume_text(filepath: str) -> str:
    if filepath.endswith(".pdf"):
        return extract_text_from_pdf(filepath)
    elif filepath.endswith(".docx"):
        return extract_text_from_docx(filepath)
    else:
        logger.warning(f"Unsupported file format for parsing text: {filepath}")
        return ""

import pdfplumber
import docx
from PIL import Image
import pytesseract


KEYWORDS = ["education", "experience", "skills", "projects", "internship"]


def parse_resume(path):

    text = ""

    try:

        if path.endswith(".pdf"):
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + " "

        elif path.endswith(".docx"):
            doc = docx.Document(path)
            for para in doc.paragraphs:
                text += para.text + " "

        elif path.endswith((".png", ".jpg", ".jpeg")):
            img = Image.open(path)
            text = pytesseract.image_to_string(img)

    except Exception as e:
        print("ERROR:", e)
        return None


    # 🔥 FIX 1: basic content check
    if len(text.strip()) < 50:
        return None


    # 🔥 FIX 2: relaxed keyword check
    text_lower = text.lower()

    found = any(k in text_lower for k in KEYWORDS)

    if not found:
        return None

    return text
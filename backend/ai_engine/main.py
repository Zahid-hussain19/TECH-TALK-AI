from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import psycopg2
import shutil
import os
from groq import Groq
import smtplib
from email.mime.text import MIMEText
import uuid

# 🔥 NEW IMPORTS (ADD CHESINA PART)
from email_service import send_email
from resume_parser import parse_resume
from skill_extractor import extract_skills
from evaluator import evaluate
from report_generator import generate_report
from email_sender import send_email as send_report_email
from groq import Groq
from config import DATABASE_URL, GROQ_API_KEY
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "TECH-TALK-AI Backend API is fully operational and awaiting frontend requests."}

# ---------------- CORS ----------------
# Hardened for Production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------- DB CONNECTION ----------------
def get_connection():
    return psycopg2.connect(DATABASE_URL)

# ---------------- GROQ ----------------
client = Groq(api_key=GROQ_API_KEY)

# ---------------- MODELS ----------------
class SignupModel(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class GoogleUser(BaseModel):
    email: EmailStr
    name: str

# ---------------- CREATE TABLE ----------------
def create_table():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )
        """)

        cur.execute("""
        ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS token TEXT,
            ADD COLUMN IF NOT EXISTS roll_number TEXT,
            ADD COLUMN IF NOT EXISTS branch_name TEXT,
            ADD COLUMN IF NOT EXISTS academic_year TEXT,
            ADD COLUMN IF NOT EXISTS interested_subjects TEXT,
            ADD COLUMN IF NOT EXISTS domain TEXT,
            ADD COLUMN IF NOT EXISTS latest_score INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS improvement_feedback TEXT DEFAULT '';
        """)

        cur.execute("UPDATE users SET is_verified = FALSE;")

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"⚠️ Warning: PostgreSQL database not connected yet! Please set DATABASE_URL in Render. Error: {e}")

create_table()

# ---------------- SIGNUP ----------------
from email_service import send_email

@app.post("/signup")
def signup(user: SignupModel):
    try:
        conn = get_connection()
        cur = conn.cursor()

        token = str(uuid.uuid4())

        cur.execute(
            "INSERT INTO users (name, email, password, token, is_verified) VALUES (%s,%s,%s,%s,TRUE)",
            (user.name, user.email, user.password, token)
        )
        conn.commit()

        return {"message": "Signup success"}

    except Exception as e:
        return {"error": str(e)}

# ---------------- VERIFY EMAIL ----------------
@app.get("/verify/{token}")
def verify_email(token: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("UPDATE users SET is_verified = TRUE WHERE token = %s", (token,))
        conn.commit()
        cur.close()
        conn.close()

        html_content = """
        <html>
            <body style='background:#0b0f19; color:#ffffff; font-family:Arial, sans-serif; text-align:center; padding:50px;'>
                <h2 style='color:#00ff9d; font-size: 32px;'>✅ Account Successfully Verified!</h2>
                <p style='color:#cbd5e1; font-size: 18px; margin-bottom: 30px;'>Dashboard and Resume Options Unlocked.</p>
                <p style='color:#6b7280; font-size: 14px;'>You may close this tab and return to the main application.</p>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        return {"error": str(e)}

@app.get("/check-verified/{email}")
def check_verified(email: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT is_verified, name FROM users WHERE email=%s", (email,))
        result = cur.fetchone()
        cur.close()
        conn.close()
        if result:
            return {"is_verified": result[0], "name": result[1]}
        return {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}

# Production Security Hardened - Development endpoints removed.

# ---------------- PROFILE ENDPOINTS ----------------
class ProfileUpdate(BaseModel):
    email: EmailStr
    name: str = ""
    roll_number: str
    branch_name: str
    academic_year: str
    interested_subjects: str
    domain: str

@app.post("/update-profile")
def update_profile(data: ProfileUpdate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE users SET 
                name=%s, roll_number=%s, branch_name=%s, academic_year=%s, 
                interested_subjects=%s, domain=%s 
            WHERE email=%s
        """, (data.name, data.roll_number, data.branch_name, data.academic_year, data.interested_subjects, data.domain, data.email))
        
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/get-profile/{email}")
def get_profile(email: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT name, roll_number, branch_name, academic_year, interested_subjects, domain, latest_score, improvement_feedback FROM users WHERE email=%s", (email,))
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if result:
            return {
                "name": result[0] or "",
                "roll_number": result[1] or "",
                "branch_name": result[2] or "",
                "academic_year": result[3] or "",
                "interested_subjects": result[4] or "",
                "domain": result[5] or "",
                "latest_score": result[6] or 0,
                "improvement_feedback": result[7] or ""
            }
        return {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}


# ---------------- LOGIN ----------------
@app.post("/login")
def login(user: LoginModel):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT is_verified FROM users WHERE email=%s AND password=%s",
            (user.email, user.password)
        )

        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            return {"message": "Login success"}
        else:
            return {"error": "Invalid credentials"}

    except Exception as e:
        return {"error": str(e)}

# ---------------- GOOGLE LOGIN ----------------
@app.post("/google-login")
def google_login(user: GoogleUser):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, is_verified FROM users WHERE email=%s", (user.email,))
        existing = cur.fetchone()

        if existing:
            is_verified = existing[1]
            if not is_verified:
                token = str(uuid.uuid4())
                cur.execute("UPDATE users SET token=%s WHERE email=%s", (token, user.email))
                conn.commit()
                try:
                    send_email(user.email, user.name, token)
                except Exception as mail_err:
                    print("Mail ignored:", mail_err)
                cur.close()
                conn.close()
                return {"message": "Verification email sent", "must_verify": True}
            else:
                cur.close()
                conn.close()
                return {"message": "Google login success", "must_verify": False}
        else:
            token = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO users (name, email, password, token, is_verified) VALUES (%s,%s,%s,%s,FALSE)",
                (user.name, user.email, "google_user", token)
            )
            try:
                send_email(user.email, user.name, token)
            except Exception as mail_err:
                print("Mail ignored:", mail_err)
            
            conn.commit()
            cur.close()
            conn.close()

            return {"message": "Verification email sent", "must_verify": True}

    except Exception as e:
        return {"error": str(e)}

# ---------------- RESUME PARSE (NEW SYSTEM) ----------------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/parse-resume")
async def parse_resume_api(file: UploadFile = File(...)):

    allowed_types = ["pdf", "docx", "png", "jpg", "jpeg"]
    ext = file.filename.split(".")[-1].lower()

    if ext not in allowed_types:
        return {"error": "Only PDF, DOCX, Image allowed"}

    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🔥 PARSE TEXT
    text = parse_resume(file_path)

    if not text:
        return {"error": "Invalid Resume ❌ Re-upload"}

    # 🔥 EXTRA STRICT CHECK
    if len(text.strip()) < 100:
        return {"error": "Resume too short ❌"}

    # 🔥 EXTRACT SKILLS
    skills = extract_skills(text)

    if not skills or len(skills) < 2:
        return {"error": "No valid skills found ❌"}

    return {"skills": skills}


# ---------------- GENERATE QUESTIONS (UPDATED GROQ) ----------------
@app.post("/generate-questions")
def generate_questions(data: dict):

    skills = data.get("skills", [])

    if not skills:
        return {"error": "No skills provided"}

    prompt = f"First, generate a friendly 1-sentence welcome introduction greeting the candidate (e.g. 'Hello! Welcome to the interview... I see you have experience with [Mention one or two key skills]'). Then, starting on the NEXT line, generate exactly 7 highly relevant, accurate, professional technical interview questions based strictly on these extracted resume skills: {skills}. Start with basics and scale up intelligently. Return ONLY these 8 lines exactly separated by single newlines. DO NOT include any numbering (like 1., 2.), NO bullet points, NO asterisks, NO formatting, and NO extra dialogue! RAW STRINGS ONLY."

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a professional technical interviewer. Output exactly 8 lines: 1st line is a greeting/intro, next 7 lines are the unnumbered questions."},
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content

    questions = [q.strip() for q in output.split("\n") if q.strip()]

    return {"questions": questions}

# ---------------- GENERATE EASIER QUESTIONS (DYNAMIC SCALING) ----------------
@app.post("/generate-easier-questions")
def generate_easier_questions(data: dict):
    
    skills = data.get("skills", [])
    if not skills:
        return {"error": "No skills provided"}

    prompt = f"The candidate is struggling significantly. Generate exactly 7 VERY EASY, fundamental, entry-level interview questions based strictly on these extracted resume skills: {skills}. Return ONLY these 7 lines exactly, separated by single newlines. DO NOT include any numbering (like 1., 2.), NO bullet points, NO asterisks, NO formatting, and NO extra dialogue. RAW STRINGS ONLY!"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a friendly technical interviewer adjusting difficulty. Output exactly 7 unnumbered, fundamental questions."},
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content
    questions = [q.strip() for q in output.split("\n") if q.strip()]
    return {"questions": questions}

# ---------------- GENERATE GUEST QUESTIONS ----------------
@app.post("/generate-guest-questions")
def generate_guest_questions(data: dict):
    domain = data.get("domain", "")
    language = data.get("language", "")
    branch = data.get("branch", "")

    if not domain or not language:
        return {"error": "Domain and Language required"}

    prompt = f"The candidate is a technical Guest from the {branch} branch. Generate exactly 7 highly rigorous, professional, and sophisticated technical interview questions strictly focusing on the core principles of {domain} using {language}. Escalate the difficulty from fundamental to advanced. Very first line: 'Hello! I am ready to evaluate you... I see you selected {domain}'. Next 7 lines are the questions. Return ONLY these 8 lines exactly, separated by single newlines. DO NOT include any numbering, bullets, or extra chat. RAW TEXT ONLY!"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a professional technical interviewer testing a guest. Output exactly 8 unnumbered lines string. First line welcome, next 7 questions."},
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content
    questions = [q.strip() for q in output.split("\n") if q.strip()]
    return {"questions": questions}

# ---------------- LIVE ANSWER EVALUATOR ----------------
class LiveAnswer(BaseModel):
    question: str
    answer: str

@app.post("/evaluate-answer-live")
def evaluate_answer_live(data: LiveAnswer):
    prompt = f"""
    The user is answering an interview question.
    Question: "{data.question}"
    Answer provided: "{data.answer}"
    
    Determine if the answer is:
    1. 'skipped' (the candidate explicitly skipped, said they don't know, or gave up)
    2. 'irrelevant' (the candidate's answer is complete nonsense or totally unrelated to the question)
    3. 'relevant' (the candidate made a genuine attempt to answer, even if partially incorrect)
    
    Return ONLY a JSON object with this exact schema:
    {{"status": "<relevant|irrelevant|skipped>", "feedback": "<a short 1-sentence tip if irrelevant>"}}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a JSON-only API evaluating interview answers in real-time."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        # Fallback cleanly to allow interview to proceed
        return {"status": "relevant", "feedback": str(e)}

# ---------------- SEND REPORT (AND TRACK SCORE) ----------------
class ReportData(BaseModel):
    email: EmailStr | None = None
    answers: list
    questions: list
    stress_count: int
    adjusted_difficulty: bool
    emotion_score: int = 0
    head_penalty: int = 0
    interview_completed: bool = True

@app.post("/send_report")
def send_report_api(data: ReportData):
    try:
        # Pass adjusted_difficulty into evaluation
        report_data = evaluate(data.questions, data.answers, data.stress_count, data.adjusted_difficulty)
        
        # Merge Vision AI Metrics natively sourced from the browser
        report_data["vision_emotion_score"] = data.emotion_score
        report_data["vision_head_penalty"] = data.head_penalty

        # 🔥 UPDATE THE DASHBOARD METRICS!
        final_score = report_data.get("score", 0)
        feedback_list = report_data.get("areas_to_improve", [])
        top_feedback = feedback_list[0] if feedback_list else "Keep practicing your fundamentals!"

        if data.email and data.interview_completed:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
                UPDATE users SET latest_score = %s, improvement_feedback = %s
                WHERE email = %s
            """, (final_score, top_feedback, data.email))
            conn.commit()
            cur.close()
            conn.close()

        # Send Email if email exists
        if data.email:
            report_html = generate_report(report_data)
            send_report_email(data.email, report_html)
        
        return {"message": "Report evaluated.", "report_data": report_data}
    except Exception as e:
        return {"error": str(e)}
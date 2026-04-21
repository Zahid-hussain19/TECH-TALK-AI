from fastapi import APIRouter, HTTPException
from flask import app
from flask import app
from pydantic import BaseModel, EmailStr
import hashlib
import uuid
import smtplib
from backend.ai_engine.main import GoogleUser, get_connection
from backend.ai_engine.main import GoogleUser
from email.mime.text import MIMEText
from email_service import send_email
import json
import os

router = APIRouter()

# ================= DB =================
DB_FILE = "users.json"

def load_users():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

users_db = load_users()

# ================= CONFIG =================
EMAIL = os.getenv("EMAIL_ADDRESS", "techtalkai.bot@gmail.com")
APP_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ================= MODELS =================
class SignupModel(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

# ================= HASH =================
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

# ================= EMAIL =================
def send_email(to_email, token, name):
    link = f"{FRONTEND_URL}/verify-email?token={token}"

    html = f"""
    <div style="font-family:sans-serif;padding:20px">
        <h2>Welcome to TechTalk AI, {name}</h2>
        <p>Please verify your email:</p>
        <a href="{link}" 
           style="padding:12px 24px;background:#00c8ff;color:white;border-radius:6px;text-decoration:none;">
           Verify Email
        </a>
    </div>
    """

    msg = MIMEText(html, "html")
    msg["Subject"] = "Verify your TechTalk AI email"
    msg["From"] = EMAIL
    msg["To"] = to_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(EMAIL, APP_PASSWORD)
        server.send_message(msg)

# ================= SIGNUP =================
@router.post("/signup")
def signup(user: SignupModel):
    print("SIGNUP INPUT:", user.dict())

    if user.email in users_db:
        raise HTTPException(400, "User already exists")

    token = str(uuid.uuid4())

    users_db[user.email] = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "verified": False,
        "token": token
    }

    save_users(users_db)

    print("USER SAVED:", users_db[user.email])

@router.post("/google-login")
def google_login(user: GoogleUser):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email=%s", (user.email,))
    existing = cur.fetchone()

    if not existing:
        cur.execute(
            "INSERT INTO users (name, email, password) VALUES (%s,%s,%s)",
            (user.name, user.email, "google_user")
        )

    conn.commit()

    # ✅ SEND MAIL
    send_email(
        to=user.email,
        subject="Login Successful",
        body=f"Hi {user.name},\n\nYou have successfully logged in using Google.\n\nClick below to continue:\nhttp://localhost:9000/welcome"
    )

    return {"message": "Google login success"}

# ================= VERIFY =================
@router.get("/verify-email")
def verify(token: str):
    print("VERIFY TOKEN:", token)

    for email in users_db:
        if users_db[email]["token"] == token:
            users_db[email]["verified"] = True
            save_users(users_db)

            print("VERIFIED USER:", email)

            return {"message": "Email verified"}

    raise HTTPException(400, "Invalid token")

# ================= LOGIN =================
@router.post("/login")
def login(user: LoginModel):
    print("LOGIN INPUT:", user.email, user.password)
    print("DB USERS:", users_db)

    db_user = users_db.get(user.email)

    if not db_user:
        print("❌ USER NOT FOUND")
        raise HTTPException(400, "User not found")

    if not db_user["verified"]:
        print("❌ EMAIL NOT VERIFIED")
        raise HTTPException(403, "Verify email first")

    if not verify_password(user.password, db_user["password"]):
        print("❌ WRONG PASSWORD")
        raise HTTPException(401, "Invalid credentials")

    print("✅ LOGIN SUCCESS:", user.email)

    return {
        "message": "Login success",
        "name": db_user["name"]
    }

@router.post("/google-login")
def google_login(user: GoogleUser):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email=%s", (user.email,))
    existing = cur.fetchone()

    if not existing:
        cur.execute(
            "INSERT INTO users (name, email, password) VALUES (%s,%s,%s)",
            (user.name, user.email, "google_user")
        )

    conn.commit()

    # ✅ SEND MAIL
    send_email(
        to=user.email,
        subject="Login Successful",
        body=f"Hi {user.name},\n\nYou have successfully logged in using Google.\n\nClick below to continue:\nhttp://localhost:9000/welcome"
    )

    return {"message": "Google login success"}
import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("EMAIL_ADDRESS")
PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_email(to_email, name="User", token="dummy-token"):
    try:
        link = f"http://localhost:8000/verify/{token}"

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 40px; text-align: center; border-radius: 10px;">
            <h2 style="color: #00c8ff; font-size: 28px; margin-bottom: 5px;">Welcome to TechTalk AI! 🚀</h2>
            <p style="font-size: 16px; color: #cbd5e1; margin-bottom: 30px;">Hi <b>{name}</b>, we're thrilled to have you.</p>
            <p style="font-size: 16px; color: #cbd5e1; margin-bottom: 30px;">Please click the button below to verify your email and activate your account:</p>
            <a href="{link}" style="display: inline-block; background: linear-gradient(90deg, #00c8ff, #0077ff); color: #000; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,200,255,0.4);">Verify Email Now</a>
            <br/><br/>
            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
        """

        msg = MIMEText(html, "html")
        msg["Subject"] = "Verify your email"
        msg["From"] = EMAIL
        msg["To"] = to_email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
        server.quit()

        print("✅ Mail sent via SMTP")

    except Exception as e:
        print("❌ Mail error (SMTP failed):", e)
        print("Fallback: Writing verification email locally to 'emails_sent.txt'")
        with open("emails_sent.txt", "a", encoding="utf-8") as f:
            f.write(f"--- VERIFICATION EMAIL TO {to_email} ---\n{html}\n\n")
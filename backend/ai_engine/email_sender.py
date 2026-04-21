import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL=os.getenv("EMAIL_ADDRESS")
PASSWORD=os.getenv("EMAIL_PASSWORD")

def send_email(receiver,report):

    msg=MIMEText(report, "html")

    msg["Subject"]="TechTalk AI Interview Result"

    msg["From"]=EMAIL
    msg["To"]=receiver

    try:
        server=smtplib.SMTP("smtp.gmail.com",587)
        server.starttls()
        server.login(EMAIL,PASSWORD)
        server.sendmail(EMAIL,receiver,msg.as_string())
        server.quit()
        print("✅ Report Mail sent via SMTP")
    except Exception as e:
        print("❌ Report Mail error (SMTP failed):", e)
        print("Fallback: Writing report email locally to 'emails_sent.txt'")
        with open("emails_sent.txt", "a", encoding="utf-8") as f:
            f.write(f"--- REPORT EMAIL TO {receiver} ---\n{report}\n\n")
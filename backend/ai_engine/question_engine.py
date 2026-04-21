import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_questions(resume_text):

    prompt=f"""
    Based on this resume generate 5 technical interview questions.

    Resume:
    {resume_text}

    Return only numbered questions.
    """

    response = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {"role":"user","content":prompt}
        ]

    )

    text=response.choices[0].message.content

    questions = text.split("\n")

    return [q for q in questions if len(q)>5][:10]
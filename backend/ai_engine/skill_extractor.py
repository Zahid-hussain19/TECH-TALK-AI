import json
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def extract_skills(text):
    if not text or len(text.strip()) < 50:
        return []

    prompt = f"""
    You are an expert technical recruiter analyzing a resume. 
    Extract the hard technical skills, programming languages, and frameworks mentioned in the text below.
    Do not include soft skills like "leadership" or "communication".
    Return a JSON object with a single key "skills" containing an array of strings representing the skills.
    Example: {{"skills": ["Python", "React", "Docker"]}}

    Resume Text:
    {text}
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a JSON-only API. You output raw JSON exactly as requested."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        output = response.choices[0].message.content
        data = json.loads(output)
        return data.get("skills", [])
    except Exception as e:
        print("Skill extraction failed:", e)
        # Fallback to simple scan
        skills_db = ["python","java","c++","javascript","react","node","sql","mongodb","machine learning","deep learning","data science","html","css"]
        found = [s for s in skills_db if s in text.lower()]
        return found
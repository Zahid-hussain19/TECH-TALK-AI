import json
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def evaluate(questions, answers, stress_count, adjusted_difficulty=False):
    paired_data = []
    for i in range(min(len(questions), len(answers))):
        paired_data.append(f"Q: {questions[i]}\nA: {answers[i]}")
    
    prompt_content = "\n\n".join(paired_data)
    
    diff_note = ""
    if adjusted_difficulty:
        diff_note = "NOTE: The candidate struggled significantly, so the system explicitly lowered the difficulty to fundamental questions mid-interview. Reflect this gracefully but honestly in their score and areas of improvement."

    prompt = f"""
    You are an elite, highly strict Principal Software Engineer evaluating a candidate. 
    Review the following questions and the candidate's transcribed audio answers carefully.
    The candidate had {stress_count} moments of hesitation/silence during the interview.
    {diff_note}

    EVALUATION DIRECTIVE:
    - Assess technical precision, correctness, and depth.
    - Do NOT award points for vague, generic, or off-topic answers.
    - Assign scores between 1 and 100 for the main score. 
    - You MUST identify specific, highly detailed Technical areas of improvement rather than generic advice.
    
    Interview Data:
    {prompt_content}

    Provide a JSON response natively (no markdown blocks) with the exact following schema (Do not include any code block syntax or // comments):
    {{
        "score": 85,
        "verbal_skills_score": 8,
        "technical_skills_score": 7,
        "relevant_answers": 7,
        "irrelevant_answers": 1,
        "skipped_answers": 2,
        "confidence_emotion": "Moderate Stress",
        "strengths": ["Clear communication", "Understands Python basics"],
        "areas_to_improve": ["Deep dive into database routing", "Try to avoid long silences"]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a JSON-only API. You must output raw JSON explicitly matching the schema requested."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        output = response.choices[0].message.content
        data = json.loads(output)
        return data

    except Exception as e:
        # Fallback if AI parsing fails
        print("Groq evaluation failed:", e)
        return {
            "score": 50,
            "verbal_skills_score": 5,
            "technical_skills_score": 5,
            "relevant_answers": len(answers),
            "irrelevant_answers": 0,
            "skipped_answers": 0,
            "confidence_emotion": "Unknown",
            "strengths": ["Completed the interview"],
            "areas_to_improve": ["AI Evaluation Failed - Could not score properly"]
        }
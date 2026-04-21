def generate_report(report_data):
    strengths_html = "".join([f"<li style='margin-bottom:8px;'><span style='color:#00ff9d;'>✔</span> {s}</li>" for s in report_data.get("strengths", [])])
    areas_html = "".join([f"<li style='margin-bottom:8px;'><span style='color:#ffa502;'>➤</span> {a}</li>" for a in report_data.get("areas_to_improve", [])])

    return f"""
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #040814; color: #f8fafc; padding: 50px 30px; border-radius: 16px; border: 1px solid rgba(0,200,255,0.15); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-width: 600px; margin: auto;">
        <h2 style="color: #00c8ff; font-size: 32px; margin-bottom: 5px; text-align: center; font-weight: 700; letter-spacing: -0.5px;">Interview Performance Report</h2>
        <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 30px;">AI-generated technical evaluation</p>
        
        <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; margin-top: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #cbd5e1; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Overall Score</p>
            <h3 style="color: #00c8ff; font-size: 48px; margin: 10px 0;">{report_data.get('score')}<span style="font-size:24px; color:#64748b;">/100</span></h3>
            
            <div style="padding-top: 15px; margin-bottom: 10px; display: flex; justify-content: center; gap: 15px;">
               <span style="background: rgba(0,255,157,0.1); color: #00ff9d; padding: 12px 18px; border-radius: 8px; border: 1px solid rgba(0,255,157,0.2); font-size: 15px;">
                   <strong>Verbal:</strong> {report_data.get('verbal_skills_score', 'N/A')}/10
               </span>
               <span style="background: rgba(0,200,255,0.1); color: #00c8ff; padding: 12px 18px; border-radius: 8px; border: 1px solid rgba(0,200,255,0.2); font-size: 15px;">
                   <strong>Technical:</strong> {report_data.get('technical_skills_score', 'N/A')}/10
               </span>
            </div>

            <p style="margin-top: 20px; font-size: 15px;"><strong>Confidence Emotion:</strong> <span style="color:#00ff9d;">{report_data.get('confidence_emotion')}</span></p>
        </div>

        <div style="background: rgba(217, 70, 239, 0.05); padding: 25px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #d946ef;">
            <h3 style="color: #d946ef; margin-top: 0; font-size: 20px;">Vision AI Assessment 👁️</h3>
            <table style="width: 100%; text-align: left; color:#cbd5e1; font-size: 15px;">
                <tr><td style="padding-bottom: 12px;">Visual Emotion Confidence:</td><td style="color:#00ff9d; font-weight:bold; text-align:right;">{report_data.get('vision_emotion_score', 0)}/10</td></tr>
                <tr><td>Erratic Head Movement:</td><td style="color:#ff4757; font-weight:bold; text-align:right;">{report_data.get('vision_head_penalty', 0)} Penalties</td></tr>
            </table>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.05);">
            <h3 style="color: #f8fafc; margin-top: 0; font-size: 20px; border-bottom: 1px solid #334155; padding-bottom: 10px;">Question Breakdown</h3>
            <table style="width: 100%; text-align: left; color:#cbd5e1; font-size: 15px; margin-top: 15px;">
                <tr><td style="padding-bottom: 10px;">Relevant Answers</td><td style="color:#00ff9d; text-align: right; font-weight: 600;">{report_data.get('relevant_answers')}</td></tr>
                <tr><td style="padding-bottom: 10px;">Irrelevant / Wrong</td><td style="color:#ff4757; text-align: right; font-weight: 600;">{report_data.get('irrelevant_answers')}</td></tr>
                <tr><td>Skipped</td><td style="color:#ffa502; text-align: right; font-weight: 600;">{report_data.get('skipped_answers')}</td></tr>
            </table>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.05);">
            <h3 style="color: #00ff9d; margin-top: 0; font-size: 20px;">Top Strengths 💪</h3>
            <ul style="color:#cbd5e1; padding-left: 0; list-style-type: none; font-size: 15px; line-height: 1.6;">
                {strengths_html}
            </ul>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.05);">
            <h3 style="color: #ffa502; margin-top: 0; font-size: 20px;">Areas to Improve 🚀</h3>
            <ul style="color:#cbd5e1; padding-left: 0; list-style-type: none; font-size: 15px; line-height: 1.6;">
                {areas_html}
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="http://localhost:3000/dashboard" style="display: inline-block; background: linear-gradient(90deg, #00c8ff, #0077ff); color: #ffffff; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0,200,255,0.3);">Go to Dashboard</a>
        </div>
    </div>
    """
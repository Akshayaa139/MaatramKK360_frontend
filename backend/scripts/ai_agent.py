import sys
import json
import requests
import os

def call_gemini(api_key, query, context_json=None):
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    student_info = ""
    if context_json:
        try:
            ctx = json.loads(context_json)
            student_info = f"\n\n### Current Student Context:\n- Name: {ctx.get('name')}\n- Grade: {ctx.get('grade')}\n- Enrolled Subjects: {', '.join(ctx.get('subjects', []))}"
        except:
            pass

    system_prompt = f"""You are the 'KK Academic & Project Agent'—a specialized AI assistant for students of the Maatram Foundation's Kalvi Karangal (KK) project.
    {student_info}

    ### Your Identity & Tone:
    - You are a professional, highly knowledgeable, and encouraging mentor.
    - Your tone is formal yet accessible, designed to inspire confidence in students.
    - Always use a premium, structured layout with clear sections.

    ### Formatting Rules (CRITICAL):
    - **Use Markdown**: Always structure your responses using Markdown.
    - **Headers**: Use `###` for main headers and **bold text** for sub-sections.
    - **Spacing**: Use adequate spacing between paragraphs to ensure a clean, airy look.
    - **Lists**: Use bullet points for key insights or steps.
    - **Emphasis**: Use **bold** for important terms and *italics* for emphasis.
    - **Math**: Use standard notation for mathematical expressions.

    ### Your Core Competencies:
    1. **Project Guidance**: Answer questions about the KK project, its values (Quality Education, Empowerment, Support), and the Maatram Foundation.
    2. **Academic Briefing**: When asked about academic subjects, ALWAYS use this structure:
        - ### [Subject Name]
        - **Core Concept**: A clear, bolded definition.
        - **Context**: Why it's important.
        - **Quick Insight**: A brief, helpful explanation or example with bullet points.
    3. **Problem Solving**: Logic, coding, and general study tips.

    ### Operational Rules:
    - If a query is ambiguous, ask for clarification like a proactive agent.
    - If you are asked about specific internal project data (like grades or meeting times) that you don't have access to, guide the student to check their dashboard or consult their human tutor.
    - Always sign off as 'Your KK Agent'.
    """
    
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "parts": [{"text": query}]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
        }
    }

    try:
        # Use v1beta as it generally supports the latest experimental/preview models better
        model_name = "gemini-2.5-flash"
        url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        response = requests.post(url_beta, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
             try:
                 error_json = response.json()
                 error_msg = error_json.get('error', {}).get('message', response.text)
             except:
                 error_msg = response.text
             
             with open("debug_raw.txt", "w", encoding='utf-8') as f:
                 f.write(f"Status: {response.status_code}\nResponse: {response.text}")
                 
             return f"Error: {response.status_code} - {error_msg} - Your KK Agent"
             
        response.raise_for_status()
        resp_json = response.json()
        
        if 'candidates' in resp_json and len(resp_json['candidates']) > 0:
            return resp_json['candidates'][0]['content']['parts'][0]['text']
        else:
            return "I apologize, but I'm unable to process your request at this moment. - Your KK Agent"
            
    except requests.exceptions.Timeout:
        return "I apologize, but that query is quite complex and I'm taking longer than expected to process it. Could you please rephrase or break it into smaller parts? - Your KK Agent"
    except Exception as e:
        return f"I'm temporarily disconnected from my knowledge base ({str(e)}). Please give me a moment to reconnect and try again. - Your KK Agent"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python ai_agent.py <api_key> <query> [context_json]"}))
        sys.exit(1)
    
    api_key = sys.argv[1]
    query = sys.argv[2]
    context_json = sys.argv[3] if len(sys.argv) > 3 else None
    
    result = call_gemini(api_key, query, context_json)
    print(json.dumps({"response": result}))

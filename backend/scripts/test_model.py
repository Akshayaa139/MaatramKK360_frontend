
import requests
import sys

def call_gemini(api_key):
    # Trying gemini-pro
    model_name = "gemini-pro"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": "Hello, this is a test."}]}]
    }
    
    print(f"Testing model: {model_name}")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
            print(response.json()['candidates'][0]['content']['parts'][0]['text'])
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_model.py <api_key>")
    else:
        call_gemini(sys.argv[1])

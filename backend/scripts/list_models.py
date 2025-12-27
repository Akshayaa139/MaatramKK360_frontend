
import requests
import sys
import json


def list_models(api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    with open("models_found.txt", "w") as f:
        f.write(f"Listing models from: {url}\n")
        try:
            response = requests.get(url, timeout=30)
            f.write(f"Status Code: {response.status_code}\n")
            if response.status_code == 200:
                models = response.json().get('models', [])
                for m in models:
                     # Log all models to be sure
                    f.write(f"Model: {m['name']} - {m['displayName']} - Methods: {m.get('supportedGenerationMethods')}\n")
            else:
                f.write(f"Error: {response.text}\n")
        except Exception as e:
            f.write(f"Exception: {e}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python list_models.py <api_key>")
    else:
        list_models(sys.argv[1])


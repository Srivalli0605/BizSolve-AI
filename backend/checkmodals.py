import os
from google import genai

api_key = input("Paste your GEMINI_API_KEY: ").strip()
client = genai.Client(api_key=api_key)

print("\nAvailable models:")
for model in client.models.list():
    print("-", model.name)

































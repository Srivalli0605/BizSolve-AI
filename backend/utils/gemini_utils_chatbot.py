import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def generate_chat_response(prompt: str) -> str:
    """
    Sends prompt to Gemini and returns a concise, complete response.
    """

    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=(
                "You are a concise, expert business advisor. "
                "You give sharp, complete, actionable advice in 200 words or fewer it should be answered in 200 words not half answers. "
                "You ALWAYS finish your response completely — never cut off mid-sentence. "
                "You NEVER pad responses with unnecessary filler or repetition."
            ),
        )

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=1500,  # FIXED: enough tokens to complete 150 words safely
                temperature=0.7,
                top_p=0.90,
            ),
            request_options={"timeout": 30},
        )

        if not response or not response.text:
            raise ValueError("Gemini returned empty response.")

        return response.text.strip()

    except ValueError:
        raise
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")
import json
from typing import Any


def build_prompt(selected_text: str) -> str:
    return f"""
You are a dictionary assistant.

For the given English word or short phrase, return ONLY valid JSON in this exact format:
{{
  "meaning": "short English meaning",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "persian_meaning": "Persian translation",
  "example_en": "One short natural English sentence using the word"
}}

Word or phrase: {selected_text}
""".strip()


def normalize_qwen_output(data: dict[str, Any]) -> dict[str, Any]:
    meaning = str(data.get("meaning", "")).strip()
    persian_meaning = str(data.get("persian_meaning", "")).strip()
    example_en = str(data.get("example_en", "")).strip()

    raw_synonyms = data.get("synonyms", [])
    if isinstance(raw_synonyms, list):
        synonyms = [str(item).strip() for item in raw_synonyms if str(item).strip()]
    elif isinstance(raw_synonyms, str):
        synonyms = [part.strip() for part in raw_synonyms.split(",") if part.strip()]
    else:
        synonyms = []

    return {
        "meaning": meaning,
        "synonyms": synonyms,
        "persian_meaning": persian_meaning,
        "example_en": example_en,
    }


def format_comment(data: dict[str, Any]) -> str:
    synonyms_text = ", ".join(data.get("synonyms", [])) or "N/A"

    return (
        f"Meaning of the word: {data.get('meaning') or 'N/A'}\n"
        f"Synonyms: {synonyms_text}\n"
        f"Persian meaning: {data.get('persian_meaning') or 'N/A'}\n"
        f"Example in English: {data.get('example_en') or 'N/A'}"
    )


def call_llm(selected_text: str) -> dict[str, Any]:
    """
    Temporary stub.
    Replace this with your actual Qwen inference call.
    """

    _prompt = build_prompt(selected_text)

    # Fake model output for now
    fake_model_json = json.dumps(
        {
            "meaning": f"A simple meaning for '{selected_text}'.",
            "synonyms": ["similar word 1", "similar word 2", "similar word 3"],
            "persian_meaning": f"ترجمه فارسی {selected_text}",
            "example_en": f"This is an example sentence using {selected_text}.",
        }
    )

    parsed = json.loads(fake_model_json)
    return normalize_qwen_output(parsed)
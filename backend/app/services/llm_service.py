import json
from typing import Any

from ollama import chat


OLLAMA_MODEL = "qwen2.5:7b"


def build_messages(selected_text: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are a dictionary assistant. "
                "For the given English word or short phrase, return ONLY valid JSON "
                "with this exact shape:\n"
                "{\n"
                '  "meaning": "short English meaning",\n'
                '  "synonyms": ["synonym1", "synonym2", "synonym3"],\n'
                '  "persian_meaning": "Persian translation",\n'
                '  "example_en": "One short natural English sentence using the word"\n'
                "}\n"
                "Do not include markdown fences. Do not add explanations."
            ),
        },
        {
            "role": "user",
            "content": f"Word or phrase: {selected_text}",
        },
    ]


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


def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()

    # direct JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # fallback: strip markdown fences if model adds them anyway
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
            return json.loads(text)

    # fallback: first {...} block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])

    raise ValueError("Model response did not contain valid JSON")


def format_comment(data: dict[str, Any]) -> str:
    synonyms_text = ", ".join(data.get("synonyms", [])) or "N/A"

    return (
        f"Meaning of the word: {data.get('meaning') or 'N/A'}\n"
        f"Synonyms: {synonyms_text}\n"
        f"Persian meaning: {data.get('persian_meaning') or 'N/A'}\n"
        f"Example in English: {data.get('example_en') or 'N/A'}"
    )


def call_llm(selected_text: str) -> dict[str, Any]:
    response = chat(
        model=OLLAMA_MODEL,
        messages=build_messages(selected_text),
        options={
            "temperature": 0.1,
        },
        keep_alive="10m"
    )

    content = response["message"]["content"]
    parsed = extract_json(content)
    return normalize_qwen_output(parsed)
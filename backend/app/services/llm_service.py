import json
import os
from typing import Any

from ollama import Client

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")

# Increase timeout because first response from a local model in Docker can be slow.
client = Client(
    host=OLLAMA_HOST,
    timeout=300.0,  # seconds
)


def build_messages(
    selected_text: str,
    context_sentence: str | None = None,
    context_paragraph: str | None = None,
) -> list[dict[str, str]]:
    sentence = (context_sentence or "").strip()
    paragraph = (context_paragraph or "").strip()

    return [
        {
            "role": "system",
            "content": (
                "You are a reading assistant. "
                "Your task is to explain the meaning of highlighted English text based on its context in a document. "
                "Do not define the text in isolation unless no context is provided. "
                "Use the sentence and paragraph to choose the most suitable meaning in context. "
                "Return ONLY valid JSON with this exact shape:\n"
                "{\n"
                '  "meaning": "short English meaning in this context",\n'
                '  "synonyms": ["synonym1", "synonym2", "synonym3"],\n'
                '  "persian_meaning": "Persian translation based on this context",\n'
                '  "example_en": "One short natural English sentence using the same meaning"\n'
                "}\n"
                "Rules:\n"
                "- Output JSON only.\n"
                "- No markdown fences.\n"
                "- No explanations outside JSON.\n"
                "- Prefer contextual meaning over dictionary meaning.\n"
                "- Synonyms must match the meaning used in this context.\n"
                "- If context is weak, do your best using the available text."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Highlighted text: {selected_text}\n\n"
                f"Sentence context: {sentence or 'N/A'}\n\n"
                f"Paragraph context: {paragraph or 'N/A'}"
            ),
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

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
            return json.loads(text)

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])

    raise ValueError("Model response did not contain valid JSON")


def format_comment(data: dict[str, Any]) -> str:
    synonyms_text = ", ".join(data.get("synonyms", [])) or "N/A"

    return (
        f"Meaning in this context: {data.get('meaning') or 'N/A'}\n"
        f"Synonyms: {synonyms_text}\n"
        f"Persian meaning: {data.get('persian_meaning') or 'N/A'}\n"
        f"Example in English: {data.get('example_en') or 'N/A'}"
    )


def call_llm(
    selected_text: str,
    context_sentence: str | None = None,
    context_paragraph: str | None = None,
) -> dict[str, Any]:
    response = client.chat(
        model=OLLAMA_MODEL,
        messages=build_messages(
            selected_text=selected_text,
            context_sentence=context_sentence,
            context_paragraph=context_paragraph,
        ),
        options={
            "temperature": 0.1,
        },
        keep_alive="10m",
    )

    content = response["message"]["content"]
    parsed = extract_json(content)
    return normalize_qwen_output(parsed)
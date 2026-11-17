"""Local lexical retrieval over reviewed notes, with extractive responses and citations."""
import json
import re
import unicodedata
from .discovery_service import CATALOGUE, DATA

DOCUMENTS = json.loads((DATA / "knowledge_base.json").read_text(encoding="utf-8"))


def normalized(text):
    text = unicodedata.normalize("NFKD", text.lower())
    return " ".join(re.findall("[a-z0-9]+", text.encode("ascii", "ignore").decode("ascii")))


def answer(question, object_id=None):
    query = f" {normalized(question)} "
    matches = []
    for document in DOCUMENTS:
        score = sum(len(term.split())**2 for term in document["terms"] if f" {term} " in query)
        if score:
            matches.append((score, document))
    document = max(matches, key=lambda item: item[0])[1] if matches else None
    follow_up = set(query.split()) & {"it", "that", "this", "purpose", "function", "importance"}
    if not document and object_id in CATALOGUE and follow_up:
        document = {"objects": [object_id]}
    if not document:
        return {"answer": "I couldn’t find that in the mission archive. Ask about the Apollo rover, Challenger’s descent stage, ALSEP, or the Taurus–Littrow traverses.", "sources": []}
    entries = [CATALOGUE[key] for key in document["objects"]]
    sources = {source["url"]: source for entry in entries for source in entry["sources"]}
    first = entries[0]
    return {"answer": document.get("text") or f'{first["description"]} {first["function"]} {first["importance"]}',
            "sources": list(sources.values())}

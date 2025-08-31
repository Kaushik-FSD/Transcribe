# 📝 Transcribe - AI Meeting Transcript Analyzer

An AI-powered meeting assistant that processes long meeting transcripts (10k–20k words), extracts **summaries, action items, and sentiment**, and returns clean structured JSON.  
Built with **Node.js (Express) + Gemini API**.

---

## 🚀 Features

- ✅ **Chunking strategy** to handle very large transcripts (splits into ~2000-word chunks with overlap).
- ✅ **Domain-aware analysis** (optional) – you can provide a `description` (e.g., "technical", "sales", "business") to improve accuracy.
- ✅ **Jargon & technical term preservation** – cleaning the transcription, removed common filler/noise words and corrects common misinterpretations using the jargon dictionary.
- ✅ **Action item extraction** – assigns tasks with `task`, `assignee`, and `deadline`.
- ✅ **Majority sentiment detection** – overall mood ("positive", "neutral", "negative").
- ✅ **Final merged summary** – combines partial summaries chunks into a coherent output.

---

## 📡 API Endpoints

### 1. Analyze Transcript

`POST http://localhost:9988/api/analyze/generateSummary`

#### Request Body

```json
{
  "inputTranscript": "Full transcription text goes here...",
  "description": "technical team meeting" // optional
}
```

#### Response Body

```json
{
  "message": "Transcript analyzed successfully",
  "status": "success",
  "data": {
    "summary": "High-level summary of the entire meeting...",
    "action_items": [
      {
        "task": "Prepare Q3 budget report",
        "assignee": "Alice",
        "deadline": "next friday"
      },
      {
        "task": "Fix API cache issue",
        "assignee": "Bob",
        "deadline": "2025-09-05"
      }
    ],
    "sentiment": "neutral"
  }
}
```

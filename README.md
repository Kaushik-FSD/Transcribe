# 📝 Transcribe - AI Meeting Transcript Analyzer

An AI-powered (api only) meeting assistant that processes long meeting transcripts (10k–20k words), extracts **summaries, action items, and sentiment**, and returns clean structured JSON.  
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

### 1. Home Page

A simple home/welcome route (optional).

URL: `GET http://localhost:9988/`

### 2. Analyze Transcript

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

---

## 📌 Future Enhancements

- ✅ **Database Integration** – Persist history of meeting summaries.
- ✅ **Authentication & Authorization** – Restrict access with user roles.
- ✅ **Security & Privacy** – Encrypt transcripts (sensitive company data).
- ✅ **File upload support** – Upload .txt files and read it and then process the transcription.

---

## 📂 Example Use Case

- ✅ Upload a 10k-word meeting transcript.
- ✅ API splits into smaller chunks and processes them.
- ✅ Get a clean JSON summary → ready to integrate into dashboards, CRMs, or task trackers like Jira/Asana.

---

## 🧑‍💻 Tech Stack

- Node.js / Express.js – REST API
- Google Gemini API – LLM for transcript analysis
- jsonrepair – Fixes broken/partial JSON outputs
- Custom Chunking Logic – Handles long transcripts

---

## 🏁 Getting Started

```
# Clone repo
git clone <your-repo-url>
cd meeting-transcript-analyzer

# Install dependencies
npm install

# Start server
npm start
```

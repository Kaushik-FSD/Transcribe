const { GoogleGenAI } = require("@google/genai");
const { jsonrepair } = require("jsonrepair");
const dotenv = require("dotenv");
const path = require("path");
const JARGON_DICT = require("./jargonWordDict");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

//cleaning the transcription
function cleanTranscription(transcript) {
  // Common filler/noise words
  const fillers = /\b(um+|uh+|you know|like|basically|actually|so|hmm+)\b/gi;
  let cleaned = transcript.replace(fillers, "");

  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Correct common misinterpretations using the jargon dictionary
  let corrected = cleaned;
  for (const [wrong, right] of Object.entries(JARGON_DICT)) {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    corrected = corrected.replace(regex, right);
  }

  return cleaned;
}

// Utility: Split transcript into chunks (by words)
function chunkTranscript(text, chunkSize = 2000, overlap = 200) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

async function generateContentFromGemini(prompt) {
  const geminiResponse = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.2 },
    generationConfig: { responseMimeType: "application/json" },
  });

  return geminiResponse;
}

async function analyzeTextTranscript(inputTranscript, description) {
  const cleanedTranscript = cleanTranscription(inputTranscript);

  // STEP 1: Break transcript into chunks
  const chunks = chunkTranscript(cleanedTranscript, 2000, 200);

  let partialSummaries = [];
  let allActionItems = [];
  let sentiments = [];

  // STEP 2: Analyze each chunk separately
  for (let chunk of chunks) {
    let prompt = `
    You are an AI meeting assistant. With more than 90% accuracy, extract the following information from the meeting transcript:
    Given the following meeting transcript, provide a JSON response with:
    1. summary
    2. action_items (array of {task, assignee, deadline})
    3. sentiment ("positive", "neutral", "negative")

    Transcript: """${chunk}"""

    Remember that You are analyzing a meeting transcript.
    The context may be business, sales, technical or any domain, read the transcript and understand it.
    If term company jargon appear, keep them as-is without changing their meaning.
    If words sound similar to technical terms (e.g., "cash" = "cache"), infer the correct technical meaning.
    Always preserve context.
  `;

    if (description?.trim()) {
      prompt += `\nFor reference this is the short description or you can say the domain of the transcription: ${description}`;
    }

    const geminiResponse = await generateContentFromGemini(prompt);

    const candidate = geminiResponse?.candidates?.[0];
    if (!candidate) continue;

    const text = candidate.content.parts[0].text;
    if (!text) continue;

    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const repaired = jsonrepair(cleanedText);
      const jsonResponse = JSON.parse(repaired);

      partialSummaries.push(jsonResponse.summary);
      if (jsonResponse.action_items)
        allActionItems.push(...jsonResponse.action_items);
      if (jsonResponse.sentiment) sentiments.push(jsonResponse.sentiment);
    } catch (err) {
      console.error("Chunk parse failed:", err);
    }
  }

  // STEP 3: Merge partial results into one final summary
  const mergePrompt = `
  You are an AI meeting assistant.
  Combine the following partial meeting summaries into one coherent final summary.
  Also, deduplicate action items.
  
  Partial summaries: ${JSON.stringify(partialSummaries)}
  Action items: ${JSON.stringify(allActionItems)}

  Return only JSON in this format:
  {
    "summary": "...",
    "action_items": [ { "task": "...", "assignee": "...", "deadline": "..." } ],
    "sentiment": "positive|neutral|negative"
  }
  `;

  const finalResponse = await generateContentFromGemini(mergePrompt);

  const candidate = finalResponse?.candidates?.[0];
  if (!candidate) throw new Error("No final candidate returned");

  const outputText = candidate.content.parts[0].text;
  const cleanedText = outputText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  const repaired = jsonrepair(cleanedText);
  const jsonResponse = JSON.parse(repaired);

  // Compute majority sentiment if you prefer
  if (!jsonResponse.sentiment && sentiments.length > 0) {
    jsonResponse.sentiment =
      sentiments.filter((s) => s === "positive").length > sentiments.length / 2
        ? "positive"
        : sentiments.filter((s) => s === "negative").length >
          sentiments.length / 2
        ? "negative"
        : "neutral";
  }

  return {
    message: "Transcript analyzed successfully",
    status: "success",
    data: jsonResponse,
  };
}

module.exports = analyzeTextTranscript;

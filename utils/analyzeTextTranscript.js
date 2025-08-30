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

// Handler function to call Google Gemini API
async function analyzeTextTranscript(inputTranscript, description) {
  const cleanedTranscript = cleanTranscription(inputTranscript);

  let prompt = `
  You are an AI meeting assistant. With more than 90% accuracy, extract the following information from the meeting transcript:
  Given the following meeting transcript, provide a JSON response with:
  1. summary
  2. action_items (array of {task, assignee, deadline})
  3. sentiment ("positive", "neutral", "negative")

  Transcript: """${cleanedTranscript}"""

  Remember that You are analyzing a meeting transcript.
  The context may be business, sales, technical or any domain, read the transcript and understand it.
  If term company jargon appear, keep them as-is without changing their meaning.
  If words sound similar to technical terms (e.g., "cash" = "cache"), infer the correct technical meaning.
  Always preserve context.
  `;

  //Handle description if provided, add it to the prompt
  if (
    description !== null &&
    description !== undefined &&
    description.trim() !== ""
  ) {
    prompt += `\nFor reference this is the short description or you can say the domain of the transcription: ${description}`;
  }

  const geminiResponse = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
    },
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // console.log("Gemini Response:", geminiResponse.candidates[0].content);

  const candidate = geminiResponse?.candidates?.[0];
  if (!candidate) {
    throw new Error(
      `No candidates. Finish or safety issue? ${JSON.stringify(geminiResponse)}`
    );
  }

  const text = candidate.content.parts[0].text;
  if (text === null || text.length === 0)
    throw new Error("Empty response text from model.");

  if (
    geminiResponse &&
    geminiResponse.candidates &&
    geminiResponse.candidates.length > 0
  ) {
    const outputText = candidate.content.parts[0].text;
    try {
      const cleanedText = outputText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const repaired = jsonrepair(cleanedText);
      const jsonResponse = JSON.parse(repaired);
      return {
        message: "Transcript analyzed successfully",
        status: "success",
        data: jsonResponse,
      };
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return {
        message: "Error parsing JSON response from model",
        status: "error",
      };
    }
  }
}

module.exports = analyzeTextTranscript;

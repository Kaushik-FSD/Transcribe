const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const { jsonrepair } = require("jsonrepair");
// const path = require("path");

dotenv.config();
const PORT = process.env.PORT || 8080;
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

// Handler function to call Google Gemini API
async function analyzeTextTranscript(inputTranscript) {
  const prompt = `
  You are an AI meeting assistant. With more than 90% accuracy, extract the following information from the meeting transcript:
  Given the following meeting transcript, provide a JSON response with:
  1. summary
  2. action_items (array of {task, assignee, deadline})
  3. sentiment ("positive", "neutral", "negative")

  Transcript: """${inputTranscript}"""
  `;

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

app.get("/", (req, res) => {
  res.json({
    message: "Please use /api/analyze endpoint to POST transcript data.",
    status: "success",
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { inputTranscript } = req.body;

    if (!inputTranscript) {
      return res.status(400).json({
        message: "inputTranscript key is required in the request body",
        status: "error",
      });
    }

    const analysedResponse = await analyzeTextTranscript(inputTranscript);
    res.json(analysedResponse);

    // res.send("Transcript received");
  } catch (error) {
    console.error("Error processing /api/analyze request:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

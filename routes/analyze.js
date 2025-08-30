const express = require("express");
const analyzeTextTranscript = require("../utils/analyzeTextTranscript");

const router = express.Router();

router.post("/generateSummary", async (req, res) => {
  try {
    const { inputTranscript } = req.body;
    const { description = "" } = req.body;

    if (!inputTranscript) {
      return res.status(400).json({
        message: "inputTranscript key is required in the request body",
        status: "error",
      });
    }

    const analysedResponse = await analyzeTextTranscript(
      inputTranscript,
      description
    );
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

module.exports = router;

const express = require("express");
const dotenv = require("dotenv");
const analyzeRouter = require("./routes/analyze");

dotenv.config();
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.json({
    message: "Please use /api/analyze endpoint to POST transcript data.",
    status: "success",
  });
});

//Routes
app.use("/api/analyze", analyzeRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

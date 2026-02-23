const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Ensure you run 'npm install node-fetch@2'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
// The URI is pulled from your .env file in the backend folder
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in your .env file!");
} else {
  // We sanitize the log to hide the password but see the host structure
  const sanitizedUri = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
  console.log(`Attempting to connect to: ${sanitizedUri}`);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas successfully!"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    console.log("\n--- TROUBLESHOOTING TIPS ---");
    console.log("1. Open backend/.env");
    console.log("2. Check for hidden spaces or special characters at the end of the URI.");
    console.log("3. Ensure the password replaced <db_password> and the brackets <> were removed.");
    console.log("4. The URI should start with 'mongodb+srv://' and end with 'w=majority'");
  });

// 2. Data Models
const StudyPlanSchema = new mongoose.Schema({
  topic: String,
  status: { type: String, default: 'Pending' },
  scheduledDate: { type: Date, default: Date.now },
});
const StudyPlan = mongoose.model('StudyPlan', StudyPlanSchema);

// 3. AI Chat Route (Socratic Pedagogy)
app.post('/api/chat', async (req, res) => {
  const { message, isExamMode } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = isExamMode 
    ? "You are a GATE Exam Supervisor. Provide a specific Previous Year Question (PYQ). Evaluate the student's logic strictly. Do not give the answer. Keep it professional and high-pressure."
    : "You are an expert GATE Tutor. Use Socratic pedagogy: Never give the direct answer. Guide the student using engineering analogies and hints. Ask leading questions that make them think of the core principles.";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Gemini API Error:", data.error.message);
        return res.status(500).json({ reply: "The AI is currently resting. Check your API key." });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm processing your query... let's try rephrasing.";
    res.json({ reply });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Backend AI Engine error" });
  }
});

// 4. Scheduling Routes
app.get('/api/schedule', async (req, res) => {
  try {
    const plans = await StudyPlan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const newPlan = new StudyPlan(req.body);
    await newPlan.save();
    res.json({ message: "Schedule updated in MongoDB!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save schedule" });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "Backend is online" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 GATE Backend running on port ${PORT}`));
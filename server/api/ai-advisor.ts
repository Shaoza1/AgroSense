//server/api/ai-advisor.ts
import express, { RequestHandler } from "express";
import { CohereClient } from "cohere-ai";

const router = express.Router();
router.use(express.json());

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

const allowedTopics = [
  "farm", "agriculture", "crop", "soil", "weather", "pest", "harvest", "yield", "plant", "animal",
  "livestock", "fertilizer", "seed", "irrigation", "greenhouse", "tractor", "disease", "weed",
  "insect", "climate", "season", "rural", "organic", "pesticide", "herbicide", "fungicide",
];

function isAgroRelated(question: string) {
  return allowedTopics.some((term) => question.toLowerCase().includes(term));
}

const aiAdvisor: RequestHandler = async (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400).json({ answer: "No question provided." });
    return;
  }
  if (!isAgroRelated(question)) {
    res.json({ answer: "Please ask a question related to farming, agriculture, or food production." });
    return;
  }
  try {
    const response = await cohere.chat({
      model: "command-r",
      message: `
You are an expert AI farming advisor. ONLY answer questions related to agriculture, crops, weather, pests, livestock, soil, tools, or best practices for farming. 
If a user asks about something unrelated, politely respond: "Please ask a question related to farming, agriculture, or food production."
User asked: ${question}
      `.trim(),
      temperature: 0.7,
      maxTokens: 500,
    });

    const answer = response.text || "Sorry, I couldn't process that.";
    res.json({ answer });
  } catch (error) {
    console.error("AI Service Error:", error);
    res.status(500).json({
      answer: "Sorry, there was an error with the AI service.",
    });
  }
};

// Attach your POST handler to the router
router.post("/", aiAdvisor);

export default router;
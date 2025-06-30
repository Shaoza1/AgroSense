// server/api/soil-readings.ts
import express from "express";

const router = express.Router();

// Simulate random NPK values (10–40%)
const randPct = () => Math.round(10 + Math.random() * 30);

router.get("/", (req, res) => {
  const farmId = req.query.farmId as string;
  
  if (!farmId) {
    res.status(400).json({ error: "Missing farmId" });
    return;
  }

  res.status(200).json({
    farmId,
    nitrogen: randPct(),
    phosphorus: randPct(),
    potassium: randPct(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
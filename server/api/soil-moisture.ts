// server/api/soil-moisture.ts
import express from "express";

const router = express.Router();

// Simulated soil moisture data generator
const simulateMoisture = (farmId: string): number =>
  Math.round(20 + Math.random() * 60); // 20–80%

/**
 * GET /api/soil-moisture?farmId=XYZ
 * Returns { farmId: string, moisture: number }
 */
router.get("/", (req, res) => {
  const farmId = req.query.farmId as string;

  if (!farmId) {
    res.status(400).json({ error: "Missing farmId" });
    return;
  }

  const moisture = simulateMoisture(farmId);
  res.status(200).json({ farmId, moisture });
});

export default router;
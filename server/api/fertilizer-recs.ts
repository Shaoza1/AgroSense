import express from "express";

const router = express.Router();

// Simple formula: deficit = target (25%) minus actual; multiply by a factor to get kg/ha.
const calcDose = (actual: number) =>
  actual < 25 ? Math.round((25 - actual) * 2) : 0;

interface Rec {
  farmId: string;
  ureaKgPerHa: number;
  dapKgPerHa: number;
  muriateOfPotashKgPerHa: number;
}

router.get("/", (req, res) => {
  const farmId = req.query.farmId as string;
  if (!farmId){
    res.status(400).json({ error: "Missing farmId" });
    return;
  } 

  // In real world, fetch actual reading; here we simulate randomly
  const actualN = Math.round(10 + Math.random() * 30);
  const actualP = Math.round(10 + Math.random() * 30);
  const actualK = Math.round(10 + Math.random() * 30);

  const rec: Rec = {
    farmId,
    ureaKgPerHa: Math.max(0, calcDose(actualN)),
    dapKgPerHa: Math.max(0, calcDose(actualP)),
    muriateOfPotashKgPerHa: Math.max(0, calcDose(actualK)),
  };

  res.json(rec);
});

export default router;

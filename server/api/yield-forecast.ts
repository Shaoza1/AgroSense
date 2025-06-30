import { Router, Request, Response, NextFunction } from "express";

// For a real model, you’d import & invoke your trained TensorFlow/PyTorch model here.
// For this example, we’ll use a simple placeholder function.
function predictYield(area: number, crop: string): number {
  // placeholder: yield = base × area
  const baseYields: Record<string, number> = {
    maize: 4.5,    // tons per acre
    wheat: 3.2,
    sorghum: 2.8,
    default: 3.0,
  };
  const base = baseYields[crop.toLowerCase()] ?? baseYields.default;
  return parseFloat((base * area).toFixed(2));
}

const router = Router();

/**
 * GET /api/yield-forecast
 * Query params:
 *   - area (number): farm size in acres
 *   - crop (string): crop code/name, e.g. "maize"
 *
 * Returns:
 * {
 *   crop: string,
 *   area: number,
 *   predictedYield: number,   // in tons
 *   unit: "tons"
 * }
 */
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction): void => {
    const area = parseFloat(req.query.area as string);
    const crop = (req.query.crop as string || "maize").toLowerCase();

    if (isNaN(area) || area <= 0) {
      res.status(400).json({ error: "Invalid or missing `area` parameter." });
      return;
    }

    const predictedYield = predictYield(area, crop);
    res.json({
      crop,
      area,
      predictedYield,
      unit: "tons",
    });
  }
);

export default router;

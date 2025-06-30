//sever/index.ts
import dotenv from "dotenv";
dotenv.config();   // ← loads server/.env into process.env

import express from "express";
import cors from "cors";
import marketPrices from "./api/market-prices";
import aiAdvisor from "./api/ai-advisor";
import yieldForecast from "./api/yield-forecast";
import soilMoisture from "./api/soil-moisture";
import tasksRouter from "./api/tasks";
import soilReadings from "./api/soil-readings";
import fertilizerRecs from "./api/fertilizer-recs";

const app = express();

// --- MODIFIED CORS CONFIGURATION ---
const frontendUrl = process.env.FRONTEND_URL;
//console.log("Backend loaded FRONTEND_URL:", frontendUrl);

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    // or if the origin matches the configured frontendUrl.
    if (!origin || origin === frontendUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 204 // For preflight requests
}));
// --- END MODIFIED CORS CONFIGURATION ---


app.use(express.json());

app.use("/api/market-prices", marketPrices);
app.use("/api/ai-advisor", aiAdvisor);
app.use("/api/yield-forecast", yieldForecast);
app.use("/api/soil-moisture", soilMoisture);
app.use("/api/tasks", tasksRouter);
app.use("/api/soil-readings", soilReadings);
app.use("/api/fertilizer-recs", fertilizerRecs);


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
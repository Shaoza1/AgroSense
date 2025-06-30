// server/api/market-prices.ts

import { Router, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import { parse } from "csv-parse";

const router = Router();

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1) Primary: TradingEconomics
    try {
      const teUrl =
        "https://api.tradingeconomics.com/markets/commodities?c=guest:guest";
      const teResp = await fetch(teUrl);

      if (teResp.ok) {
        const teData = (await teResp.json()) as any[];

        const items = teData.map((d) => ({
          commodity: d.Name ?? "Unknown",                   
          market:    d.Ticker ?? d.Symbol ?? "Global",     
          price:     d.Last != null ? d.Last.toString() : "-",
          unit:      d.unit ?? d.Unit ?? "",               
          date:      d.Date?.split("T")[0] ?? "",          
        }));

        res.json({ items });
        return;   // <— ensure the function exits here
      }

      console.warn("TE API returned status", teResp.status);
    } catch (teErr) {
      console.warn("TradingEconomics fetch error:", teErr);
    }

    // 2) Fallbacks: FAO
    const country = (req.query.country as string || "LSO").toUpperCase();
    const year    = (req.query.year    as string || new Date().getFullYear().toString());
    const filter  = JSON.stringify({ area: [{ value: country }], year: [{ value: year }] });

    // 2a) FAO CSV
    try {
      const csvUrl = `https://fenixservices.fao.org/faostat/api/v1/en/data/PP?filter=${encodeURIComponent(
        filter
      )}&format=csv`;
      const csvResp = await fetch(csvUrl);

      if (csvResp.ok) {
        const text    = await csvResp.text();
        const records = parse(text, { columns: true, skip_empty_lines: true });
        const items = records.map((d: any) => ({
          commodity: d.Item   ?? d.Element ?? "Unknown",
          market:    d.Area   ?? country,
          price:     d.Value  ?? "-",
          unit:      d.Unit   ?? "",
          date:      d.Year   ?? "",
        }));

        res.json({ items });
        return;
      }

      console.warn("FAO CSV status", csvResp.status);
    } catch (csvErr) {
      console.warn("FAO CSV error:", csvErr);
    }

    // 2b) FAO JSON
    try {
      const jsonUrl = `https://fenixservices.fao.org/faostat/api/v1/en/data/PP?filter=${encodeURIComponent(
        filter
      )}`;
      const jsonResp = await fetch(jsonUrl);

      if (jsonResp.ok) {
        const j     = await jsonResp.json();
        const items = (j.data || []).map((d: any) => ({
          commodity: d.item    ?? d.element ?? "Unknown",
          market:    d.area    ?? country,
          price:     d.Value?.toString() ?? "-",
          unit:      d.Unit    ?? "",
          date:      d.year?.toString() ?? "",
        }));

        res.json({ items });
        return;
      }

      console.warn("FAO JSON status", jsonResp.status);
    } catch (jsonErr) {
      console.warn("FAO JSON error:", jsonErr);
    }

    // 3) All sources failed
    res.status(502).json({
      error: "Unable to fetch commodity prices from any source.",
    });
  }
);

export default router;

/*const express = require("express");
const pool = require("../db");     // adjust if db.js path differs
const { Parser } = require("json2csv");

const router = express.Router();

/* TEST ROUTE (VERY IMPORTANT) */
//router.get("/test", (req, res) => {
  res.send("REPORT ROUTES WORKING");
//});

/* MONTHLY CSV DOWNLOAD */
//router.get("/export/monthly/csv", async (req, res) => {
  try {
    const { month, year } = req.query;

    const result = await pool.query(
      `
      SELECT * FROM shipments
      WHERE EXTRACT(MONTH FROM created_at) = $1
      AND EXTRACT(YEAR FROM created_at) = $2
      `,
      [month, year]
    );

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=monthly-report.csv"
    );

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("CSV generation failed");
  }
//});

//module.exports = router;
//*/

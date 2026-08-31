const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/leaderboard", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      m.id,
      m.display_name,
      m.kattis_username,
      COALESCE(SUM(p.amount), 0)::int AS points
    FROM members m
    LEFT JOIN point_entries p ON p.member_id = m.id
    WHERE m.verified = true
    GROUP BY m.id, m.display_name, m.kattis_username
    ORDER BY points DESC, m.display_name ASC
  `);

  res.json(rows);
});

module.exports = router;

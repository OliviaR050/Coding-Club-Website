const express = require("express");
const pool = require("../db");
const { requireOfficer, login, logout, me } = require("../auth");
const { fetchMillersvilleRoster, fetchKattisUserDisplayName } = require("../kattis");

const router = express.Router();

router.post("/admin/login", login);
router.post("/admin/logout", logout);
router.get("/admin/me", me);

router.use("/admin", requireOfficer);

router.get("/admin/members", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      m.id,
      m.kattis_username,
      m.display_name,
      m.kattis_rank,
      m.kattis_score,
      m.verified,
      m.added_at,
      COALESCE(SUM(p.amount), 0)::int AS points
    FROM members m
    LEFT JOIN point_entries p ON p.member_id = m.id
    GROUP BY m.id
    ORDER BY m.verified ASC, m.display_name ASC
  `);
  res.json(rows);
});

router.post("/admin/members", async (req, res) => {
  const { kattisUsername } = req.body || {};
  if (!kattisUsername) {
    return res.status(400).json({ error: "kattisUsername is required." });
  }

  let displayName;
  try {
    displayName = await fetchKattisUserDisplayName(kattisUsername);
  } catch (err) {
    return res.status(502).json({ error: `Could not look up that Kattis user: ${err.message}` });
  }

  const { rows } = await pool.query(
    `INSERT INTO members (kattis_username, display_name)
     VALUES ($1, $2)
     ON CONFLICT (kattis_username) DO NOTHING
     RETURNING *`,
    [kattisUsername, displayName]
  );

  if (rows.length === 0) {
    return res.status(409).json({ error: "That Kattis user is already in the list." });
  }

  res.status(201).json(rows[0]);
});

router.post("/admin/members/:id/verify", async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE members SET verified = true, verified_at = now() WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Member not found." });
  res.json(rows[0]);
});

router.delete("/admin/members/:id", async (req, res) => {
  await pool.query("DELETE FROM members WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

router.post("/admin/members/:id/points", async (req, res) => {
  const { amount, reason } = req.body || {};
  const parsedAmount = parseInt(amount, 10);

  if (!Number.isFinite(parsedAmount) || !reason) {
    return res.status(400).json({ error: "amount (number) and reason are required." });
  }

  const { rows } = await pool.query(
    `INSERT INTO point_entries (member_id, amount, reason, awarded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.params.id, parsedAmount, reason, req.session.officerId]
  );

  res.status(201).json(rows[0]);
});

router.post("/admin/sync-kattis", async (req, res) => {
  let roster;
  try {
    roster = await fetchMillersvilleRoster();
  } catch (err) {
    return res.status(502).json({ error: `Kattis sync failed: ${err.message}` });
  }

  let inserted = 0;
  let updated = 0;

  for (const entry of roster) {
    const { rows } = await pool.query(
      `INSERT INTO members (kattis_username, display_name, kattis_rank, kattis_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (kattis_username)
       DO UPDATE SET display_name = EXCLUDED.display_name,
                     kattis_rank = EXCLUDED.kattis_rank,
                     kattis_score = EXCLUDED.kattis_score
       RETURNING (xmax = 0) AS inserted`,
      [entry.kattisUsername, entry.displayName, entry.rank, entry.score]
    );
    if (rows[0].inserted) {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  res.json({ found: roster.length, inserted, updated });
});

module.exports = router;

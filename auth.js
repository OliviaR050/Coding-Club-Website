const pool = require("./db");
const { verifyPassword } = require("./password");

function requireOfficer(req, res, next) {
  if (req.session && req.session.officerId) {
    return next();
  }
  res.status(401).json({ error: "Not logged in." });
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const { rows } = await pool.query(
    "SELECT id, password_hash FROM officers WHERE username = $1",
    [username]
  );
  const officer = rows[0];
  const passwordMatches = officer && verifyPassword(password, officer.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  req.session.officerId = officer.id;
  res.json({ ok: true });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
}

function me(req, res) {
  res.json({ loggedIn: Boolean(req.session && req.session.officerId) });
}

module.exports = { requireOfficer, login, logout, me };

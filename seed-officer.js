const pool = require("./db");
const { hashPassword } = require("./password");

async function seedOfficer() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: node seed-officer.js <username> <password>");
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  await pool.query(
    `INSERT INTO officers (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, passwordHash]
  );
  console.log(`Officer "${username}" is ready.`);
  await pool.end();
}

seedOfficer().catch((err) => {
  console.error("Failed to seed officer:", err.message);
  process.exit(1);
});

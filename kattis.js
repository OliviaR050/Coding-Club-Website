const cheerio = require("cheerio");

const AFFILIATION_URL = "https://open.kattis.com/affiliations/millersville.edu";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Kattis returns a 403 without a browser-like User-Agent header.
async function fetchMillersvilleRoster() {
  const response = await fetch(AFFILIATION_URL, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Kattis request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const roster = [];

  $("table.table2 tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const rankText = $(cells[0]).text().trim();
    const userLink = $(cells[1]).find("a");
    const scoreText = $(cells[3]).text().trim();

    const href = userLink.attr("href");
    if (!href) return;

    const kattisUsername = href.replace("/users/", "").trim();
    const displayName = userLink.text().trim();
    const rank = parseInt(rankText, 10);
    const score = parseFloat(scoreText);

    if (!kattisUsername || !displayName) return;

    roster.push({
      kattisUsername,
      displayName,
      rank: Number.isNaN(rank) ? null : rank,
      score: Number.isNaN(score) ? null : score,
    });
  });

  return roster;
}

async function fetchKattisUserDisplayName(kattisUsername) {
  const response = await fetch(`https://open.kattis.com/users/${kattisUsername}`, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Kattis user lookup failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = $("title").text();
  const displayName = title.split(/[–-]\s*Kattis/)[0].trim();

  return displayName || kattisUsername;
}

module.exports = { fetchMillersvilleRoster, fetchKattisUserDisplayName, AFFILIATION_URL };

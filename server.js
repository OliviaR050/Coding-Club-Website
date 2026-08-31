require("dotenv").config();
const express = require("express");
const session = require("express-session");

const leaderboardRoutes = require("./routes/leaderboard");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Render (and most hosts) sit behind a proxy that terminates HTTPS;
// this lets express-session know the connection is actually secure.
app.set("trust proxy", 1);

app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret-change-me",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 8, secure: "auto" },
    })
);

app.use("/api", leaderboardRoutes);
app.use("/api", adminRoutes);

// Serve all files inside the public folder
app.use(express.static("public"));

// Make Welcome.html the homepage
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/Welcome.html");
});

app.listen(PORT, () => {
    console.log(`Website running at http://localhost:${PORT}`);
});
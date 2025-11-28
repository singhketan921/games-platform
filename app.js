require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Capture raw request bodies so the HMAC middleware can hash exactly what was sent.
const captureRawBody = (req, res, buf) => {
    req.rawBody = buf?.toString("utf8") ?? "";
};

app.use(cors());
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));

// Health route
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Load routes
require("./src/routes")(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

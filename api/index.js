const fs = require("fs");
const path = require("path");

// Trim whitespace: a stray newline/space from copy-pasting an env value is a
// classic cause of Telegram rejecting the chat_id as "not found".
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || "").trim();

// Load the styled 404 page once at module load.
const NOT_FOUND_HTML = fs.readFileSync(
  path.join(__dirname, "..", "public", "404.html"),
  "utf-8"
);

/**
 * Vercel serverless function. Every request (thanks to the catch-all rewrite
 * in vercel.json) funnels into this handler: we capture the visitor's IP,
 * forward it to Telegram, then return a simple 404 page.
 */
module.exports = async function handler(req, res) {
  const visitor = {
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "Unknown",
    referer: req.headers["referer"] || "-",
    time: new Date().toLocaleString(),
  };

  await sendToTelegram(visitor);

  res.status(404);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(NOT_FOUND_HTML);
};

/**
 * Extract the real client IP. Vercel exposes the visitor's IP in the
 * x-vercel-forwarded-for header; x-vercel-ip and x-forwarded-for are also
 * available as fallbacks (behind CDNs, the first x-forwarded-for value is used).
 */
function getClientIp(req) {
  if (req.headers["x-vercel-forwarded-for"]) {
    return req.headers["x-vercel-forwarded-for"];
  }
  if (req.headers["x-vercel-ip"]) {
    return req.headers["x-vercel-ip"];
  }
  if (req.headers["x-forwarded-for"]) {
    return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  }
  return "Unknown";
}

/** Send the visitor details to Telegram. Failures are logged, never fatal. */
async function sendToTelegram(info) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error(
      "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Set them in Vercel project settings."
    );
    return;
  }

  const message = [
    "🌐 New visitor!",
    `IP: ${info.ip}`,
    `User-Agent: ${info.userAgent}`,
    `Referer: ${info.referer}`,
    `Time: ${info.time}`,
  ].join("\n");

  // Send the chat id as a number when possible — Telegram wants a numeric id
  // for supergroups/channels, and a raw string can carry unexpected formats.
  const chatId = TELEGRAM_CHAT_ID && !Number.isNaN(Number(TELEGRAM_CHAT_ID))
    ? Number(TELEGRAM_CHAT_ID)
    : TELEGRAM_CHAT_ID;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", response.status, errorText);
      // Give a human-readable hint for the most common causes.
      if (errorText.includes("chat not found")) {
        console.error(
          "HINT: the bot must be opened/started in that chat first. " +
          "Press Start (or add the bot to the group) and message it once, " +
          "then redeploy and try again."
        );
      } else if (errorText.includes("bot not found")) {
        console.error("HINT: the TELEGRAM_BOT_TOKEN appears to be wrong or misspelled.");
      }
    } else {
      console.log("Telegram message sent to", chatId, "— ok");
    }
  } catch (err) {
    console.error("Failed to send Telegram message:", err.message);
  }
}
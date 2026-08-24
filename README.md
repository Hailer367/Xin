# IP → Telegram 404 Page (Vercel)

A tiny website that captures every visitor's **IP address** and sends it to a
**Telegram bot**, while showing a simple "404 Not Found" page so nobody suspects
anything is happening.

Built for **Vercel** using a single Node.js **serverless function**.

## How it works

1. A [serverless function](api/index.js) handles *every* request, because a
   **catch-all rewrite** in `vercel.json` routes all paths to it.
2. It reads the visitor's IP from Vercel's `x-vercel-forwarded-for` header
   (with `x-vercel-ip` and `x-forwarded-for` fallbacks), plus the user agent
   and time.
3. It POSTs that information to your Telegram bot via the Telegram Bot API.
4. It responds with a real **404** status and a styled "Page Not Found" page.

## Deploy to Vercel

1. **Create your bot** — message [@BotFather](https://t.me/botfather) on
   Telegram and use `/newbot` to get a **bot token**.

2. **Get your chat ID** — message [@userinfobot](https://t.me/userinfobot) to
   find your numeric chat ID, or use a group/channel ID.

3. **Push this project to a Git repo** (GitHub, GitHub/GitLab/Bitbucket).

4. **Import it into Vercel** at https://vercel.com — add your repo, and Vercel
   will auto-detect it (no framework setup needed).

5. **Set environment variables** in Vercel:
   - Go to your project → **Settings** → **Environment Variables**.
   - Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
   - Deploy (or wait for the automatic deploy).

6. Visit your deployed URL — it will show **404**, and your bot will receive a
   message with the visitor's IP.

## Files

```
api/index.js        The Vercel serverless function (IP capture + Telegram + 404)
public/404.html     The styled "Page Not Found" page
vercel.json         Rewrites every path to the function (catch-all)
package.json        Project metadata (no runtime dependencies)
.env.example        Template listing the required environment variables
```

> **Note:** Never share your bot token, and keep it out of the repo. Vercel
> environment variables handle this securely. Only visitors who reach your URL
> (and aren't blocked by Telegram's API firewalls in some regions) will publish
> their IP.
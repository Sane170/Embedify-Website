# Embedify website — Netlify setup

The site is a static website with Netlify Functions for Discord OAuth and publishing embeds. Do not put secrets in `index.html`, GitHub, or any browser-side code.

## 1. Deploy the website

In Netlify, import the GitHub repository `Sane170/Embedify-Website`.

- Build command: leave blank
- Publish directory: `.`
- Functions directory: `netlify/functions` (already set in `netlify.toml`)

After the first deploy, copy the site's HTTPS address, for example `https://your-site-name.netlify.app`.

## 2. Add Discord OAuth settings

In the Discord Developer Portal, open the Embedify application:

1. Open **OAuth2**.
2. Add this exact redirect URL, replacing the example with your real Netlify site address:

   `https://YOUR-SITE.netlify.app/.netlify/functions/auth-callback`

3. Save the change.
4. Copy the application's **Client Secret**. Keep it private.

The Application ID is already used by the website's Add to Discord link.

## 3. Add Netlify environment variables

In Netlify, open **Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Your Embedify Application ID |
| `DISCORD_CLIENT_SECRET` | The Client Secret from Discord Developer Portal |
| `DISCORD_REDIRECT_URI` | The exact callback URL registered above |
| `DISCORD_TOKEN` | Embedify's Bot Token |
| `SESSION_SECRET` | A new random secret with at least 32 characters |

Generate a unique random value for `SESSION_SECRET`. Do not reuse your Discord token or Client Secret. Never send either Discord secret in chat or commit it to GitHub.

After adding variables, trigger a new deploy so the functions receive them.

## 4. Bot permissions

The invite link requests only:

- View Channels
- Send Messages
- Embed Links

It does not request Administrator. A server manager can still deny the bot access to individual channels; in that case, publishing to that channel will fail until the channel permissions are corrected.

## 5. Final bot setting

Once the site is deployed, set the bot's `DASHBOARD_URL` environment variable to the Netlify site address, then restart the bot.

## Current limitations

The dashboard currently supports a basic embed with title, description, color, and footer. The user must sign in with Discord and have Manage Server or Administrator permission. Saved embed libraries, image/thumbnail fields, author fields, and interactive buttons are not included in this first dashboard version yet.

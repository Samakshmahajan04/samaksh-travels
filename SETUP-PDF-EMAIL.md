# Set up: email the customer a PDF summary after they send an enquiry

What it does: when a visitor presses **Send enquiry** and typed their email, they also get a branded
PDF trip summary (no prices) by email from inquiry@samakshtravels.com. You still receive the plain-text
enquiry table exactly as now. If this service ever fails, the enquiry still reaches you.

The site code is already in place but **switched off** (`CONFIG.pdfMailer` in `js/main.js` is empty).
Nothing changes on the live site until you finish these steps. Never paste keys into chat or into any file in this folder.

## Part A — email service (Resend, free plan: 100 emails/day)
1. Create an account at resend.com.
2. Domains -> Add domain -> `samakshtravels.com`. Resend shows a few DNS records.
3. Add those records at GoDaddy (DNS settings of samakshtravels.com). Do NOT delete the existing
   A, CNAME, MX (ImprovMX) or the SPF TXT records. Add only the new ones Resend lists.
4. Click Verify in Resend until the domain shows **Verified** (can take from minutes to a few hours).
5. API Keys -> Create key with **Sending access** only. Copy it somewhere safe (shown once).

## Part B — the helper service (Cloudflare Worker, free plan)
1. Create a free account at cloudflare.com.
2. In Terminal:
   ```
   cd ~/Documents/samaksh-travels/worker
   npm install
   npx wrangler login
   ```
   (a browser window opens; log in to Cloudflare and click Allow)
3. Create the rate-limit store:
   ```
   npx wrangler kv namespace create RL
   ```
   It prints an `id`. Open `worker/wrangler.toml` and replace `PASTE_KV_NAMESPACE_ID_HERE` with it (the id is not secret).
4. Store the Resend key as a secret (paste it when asked; it is not saved in any file):
   ```
   npx wrangler secret put RESEND_API_KEY
   ```
5. Deploy:
   ```
   npx wrangler deploy
   ```
   It prints your helper address, like `https://samaksh-mailer.YOURNAME.workers.dev`.

## Part C — switch it on (ask Claude)
Tell Claude the helper address from step B5. Claude will put it in `CONFIG.pdfMailer`, allow exactly that
address in the site's security rules (CSP `connect-src`), test on a branch, and publish after your OK.

## After it is on
- Send one test enquiry with YOUR OWN email and check: (1) you got the plain enquiry email, (2) your own
  inbox got the PDF email (check spam the first time).
- Note: FormSubmit's existing plain "thank you" email to the customer will still go out too, so a customer who
  gives an email gets two emails. Ask Claude to remove the old one if you prefer a single branded email.

## Limits and safety built in
- Max 2 PDF emails per email address per day, 10 per visitor connection per hour.
- Only requests from samakshtravels.com are accepted; the PDF is built by the helper from a fixed template, so it cannot be used to send other content.
- Resend free plan: 100 emails/day. If you exceed it, the customer simply does not get the PDF; your enquiry email is unaffected.

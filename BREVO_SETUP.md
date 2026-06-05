# Brevo Setup — Real Duck Distro

This connects **Brevo** (formerly Sendinblue) to the store for two things:

1. **Better email deliverability** — outbound mail (welcome, order confirmations, admin
   alerts) routes through Brevo's trusted relay with proper DKIM, so it stops getting
   blocked/junked the way some Hostinger sends currently are.
2. **Newsletter campaigns** — compose and blast newsletters to all active subscribers from
   **Admin → Email Campaigns**.

> **Receiving never changes.** We do **not** touch your MX records. Your
> `contact@realduckdistro.com` inbox on Hostinger keeps receiving everything exactly as
> today, and every email's reply-to points back to it.

Once you finish steps 1–4 below and paste the API key, everything works automatically.
Until then, the app silently falls back to the existing Hostinger SMTP — nothing breaks.

---

## 1. Create a Brevo account

1. Go to <https://www.brevo.com> and sign up (the free tier sends 300 emails/day — fine to
   start; upgrade a paid plan when campaign volume grows).
2. Complete their onboarding. They may ask a few questions about your sending — answer
   honestly (transactional + newsletter).

## 2. Authenticate your domain  ← **this is the part that fixes blocked mail**

Blocked/junked mail is almost always weak domain authentication. Adding these records lets
Gmail/Outlook trust mail sent for `realduckdistro.com`.

1. In Brevo: **Senders, Domains & Dedicated IPs → Domains → Add a domain** →
   `realduckdistro.com`.
2. Brevo shows you DNS records to add. Open **Hostinger → Domains → DNS / Nameservers** for
   `realduckdistro.com` and add them:
   - **DKIM** — a TXT record at `brevo._domainkey` (Brevo gives the exact host + value).
   - **DMARC** — a TXT record at `_dmarc` with value:
     `v=DMARC1; p=none; rua=mailto:contact@realduckdistro.com`
   - **SPF** — make sure `include:spf.brevo.com` is present. **Do not create a second SPF
     record.** If you already have one (e.g. `v=spf1 include:_spf.mail.hostinger.com ~all`),
     edit it to add Brevo:
     `v=spf1 include:_spf.mail.hostinger.com include:spf.brevo.com ~all`
3. Back in Brevo, click **Authenticate / Verify**. DNS can take a few minutes to a couple
   hours to propagate. You want DKIM + SPF + DMARC all green.

## 3. Verify the sender address

**Senders → Add a sender** → `contact@realduckdistro.com`. Brevo emails a confirmation
link — click it. (Once the domain in step 2 is authenticated, the sender is trusted too.)

## 4. Get your keys

1. **API key (required):** **SMTP & API → API Keys → Generate a new API key**. Name it
   `realduck-app`. Copy the value (starts with `xkeysib-`).
2. **SMTP key (optional):** only needed if you route your *personal* mail client through
   Brevo (see the last section). **SMTP & API → SMTP → generate an SMTP key.**

## 5. Plug the key into the app

Two ways — either works, the Settings UI takes priority:

- **Recommended — Admin UI:** open **Admin → Settings → Brevo**, paste the API key into
  **Brevo API Key**, confirm sender email/name, **Save**. Changes are live within seconds,
  no redeploy.
- **Or — `.env`:** set `BREVO_API_KEY=xkeysib-…` (the file already has the placeholder), then
  redeploy.

That's it. From now on the app sends through Brevo, with automatic fallback to Hostinger
SMTP if Brevo ever errors or the key is removed.

---

## 6. Sending newsletter campaigns

1. Go to **Admin → Email Campaigns**.
2. Click **Sync subscribers to Brevo** once (and any time after a big influx). This pushes
   your active subscribers into the Brevo "Newsletter Subscribers" contact list. New
   sign-ups sync automatically going forward.
3. Write a **Subject** and **Content** (plain text or HTML — it gets wrapped in the branded
   Real Duck template with an unsubscribe link automatically).
4. **Send to N subscribers** now, or set a **Schedule** time and **Schedule campaign**.
5. Track opens/clicks in Brevo's dashboard; the **Campaign history** table logs every send.

---

## 7. (Optional) Route your *personal* replies through Brevo too

Step 2 alone already greatly improves deliverability for mail you send from Hostinger. If
you also want your own replies to go out via Brevo's relay, use a desktop/mobile mail client
(Outlook, Apple Mail, Thunderbird, Gmail app "add account") with **split servers**:

| | Server | Port | Security | Login | Password |
|---|---|---|---|---|---|
| **Incoming (unchanged)** | `imap.hostinger.com` | 993 | SSL/TLS | `contact@realduckdistro.com` | your Hostinger mailbox password |
| **Outgoing (via Brevo)** | `smtp-relay.brevo.com` | 587 | STARTTLS | your Brevo account email | the **SMTP key** from step 4 |

Set the account's **From** to `contact@realduckdistro.com`. You keep reading mail from
Hostinger; only the *send* path moves to Brevo. (Hostinger **webmail** can't change its
outgoing relay — that's why this needs a mail client.)

---

*CRAFTED By W1C3*

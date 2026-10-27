# Hetherington Experience: preferences form

A private page that opens with a short personal note from David and asks
"What do you enjoy?" across six short steps. Every question is optional except the
client's name. Each response is emailed to Hetherington through SMTP2GO.

Live address: **https://experience.hetherington.net.au/**

## What's in this folder

| File | Deploy it? | What it is |
| --- | --- | --- |
| `index.html` | Yes | The form |
| `config.js` | Yes | Contact name and email, David's details. No changes needed to go live |
| `api/submit.js` | Yes | Server function that emails each response through SMTP2GO |
| `personal-link-builder.html` | Optional | Turns a client list into personal links. Lauren can just open it on her computer |
| `SETUP.md` | No | This guide |

## 1. Deploy on Vercel

1. Push this folder to a new GitHub repo, e.g. `hetherington-experience`.
2. In Vercel: Add New Project, import the repo. No framework, no build command.
   Vercel picks up `api/submit.js` as a function automatically.
3. Settings > Domains: add `experience.hetherington.net.au`. Vercel shows the DNS record to
   add, normally a CNAME `experience` pointing to `cname.vercel-dns.com`. Add it wherever
   hetherington.net.au's DNS is managed.

> The form must run on Vercel (or another host that runs functions). GitHub Pages can show
> the page but can't run `api/submit.js`, so responses wouldn't send.

## 2. Connect SMTP2GO

**In SMTP2GO**
1. Sending > Verified Senders: verify the sending domain `hetherington.net.au` (adds a few
   DNS records), or at minimum a single sender address. Without this, SMTP2GO rejects the email.
2. Sending > API Keys: create a key with permission to send email. Copy it.

**In Vercel** (Project > Settings > Environment Variables, Production)

| Name | Value |
| --- | --- |
| `SMTP2GO_API_KEY` | the key from SMTP2GO |
| `MAIL_TO` | who receives responses, comma separated, e.g. `lauren@hemts.com.au, events@hemts.com.au` |
| `MAIL_FROM` | `Hetherington Experience <experience@hetherington.net.au>` (must be on the verified domain) |
| `ALLOWED_ORIGINS` | optional. Defaults to `https://experience.hetherington.net.au`. Add the vercel.app preview address here if you want to test before the domain is live |

Then Deployments > Redeploy so the variables take effect.

**What arrives:** one email per client, subject "Hetherington Experience: Name (Company)",
answers grouped the same way as the form. Unanswered questions are left out. Replying to the
email goes straight to the client.

Responses are not stored anywhere else, so the emails are the record. Keep them in a dedicated
folder and copy each into the client's Experience Profile.

## 3. Create each client's personal link

Open `personal-link-builder.html` (double-click it). Paste the client list as
`Name, Company, Email`, one per line, and click Create links. Each link:

- greets the client by first name in David's letter ("Dear James,")
- pre-fills their name, company and email so they don't retype what we already know

Put each link in that client's email from David, ideally behind a button or the words
"Share what you enjoy". The plain address `https://experience.hetherington.net.au/` also
works; it just won't greet them by name.

## 4. Test before David's email goes out

1. Open your own personal link on a phone and a desktop.
2. Submit test answers and confirm the email arrives at every `MAIL_TO` address.
3. Reply to it and check the reply goes to the email entered in the form.

If a send ever fails, the client keeps their answers on screen and can retry, or tap
"send your answers by email" to email them to `contactEmail` in `config.js` instead.

## What the form asks

1. **About you**: name (required), company, email, birthday (day and month only)
2. **On the course**: golf interest, handicap, favourite or wish-list courses
3. **In the stands**: sports followed, teams
4. **At the table**: drinks, favourite labels or regions, restaurants, dietary requirements
5. **Beyond the office**: evenings out, occasions they'd like to hear about, travel and hobbies
6. **And finally**: anything else, plus whether invitations go to them or their EA

To change wording, edit `index.html`; each step is clearly marked. If a question is added or
renamed, add the same name to the `FIELDS` list in `api/submit.js` so it appears in the email.

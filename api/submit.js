/*
  Hetherington Experience: form handler (Vercel serverless function)
  ------------------------------------------------------------------
  Receives the form answers and emails them through SMTP2GO.
  The SMTP2GO key lives in Vercel's environment variables, never in the page.

  Environment variables (Vercel > Project > Settings > Environment Variables):
    SMTP2GO_API_KEY   required  SMTP2GO API key with permission to send email
    MAIL_TO           required  who receives responses, comma separated
                                e.g. "lauren@hemts.com.au, events@hemts.com.au"
    MAIL_FROM         required  sender on a domain verified in SMTP2GO
                                e.g. "Hetherington Experience <experience@hetherington.net.au>"
    ALLOWED_ORIGINS   optional  comma separated sites allowed to post here
                                (default: https://experience.hetherington.net.au)
*/

const FIELDS = ['Name','Company','Email','Birthday','Golf','Handicap','Golf courses','Sports','Teams',
  'Drinks','Favourite drops','Restaurants','Dietary requirements','Entertainment','Occasions',
  'Travel and hobbies','Anything else','Invitations to','EA name','EA email','Submitted'];

const GROUPS = [
  ['About', ['Name','Company','Email','Birthday']],
  ['Golf', ['Golf','Handicap','Golf courses']],
  ['Sport', ['Sports','Teams']],
  ['At the table', ['Drinks','Favourite drops','Restaurants','Dietary requirements']],
  ['Beyond the office', ['Entertainment','Occasions','Travel and hobbies']],
  ['Anything else', ['Anything else','Invitations to','EA name','EA email']]
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isEmail = s => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);

function clean(body) {
  const out = {};
  for (const k of FIELDS) {
    let v = body && body[k];
    if (v == null) continue;
    v = String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
    if (!v) continue;
    out[k] = v.slice(0, k === 'Anything else' ? 3000 : 500);
  }
  return out;
}

function buildEmail(d) {
  const rows = GROUPS.map(([title, keys]) => {
    const present = keys.filter(k => d[k]);
    if (!present.length) return '';
    return `<tr><td colspan="2" style="padding:22px 0 8px;font:600 11px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#3E6373;border-bottom:1px solid #E4E2DA">${esc(title)}</td></tr>` +
      present.map(k => `<tr>
        <td style="padding:10px 16px 10px 0;width:170px;vertical-align:top;font:13px/1.5 Arial,sans-serif;color:#3E6373">${esc(k)}</td>
        <td style="padding:10px 0;vertical-align:top;font:15px/1.5 Arial,sans-serif;color:#152E38">${esc(d[k]).replace(/\n/g,'<br>')}</td>
      </tr>`).join('');
  }).join('');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#EDEBE4">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEBE4"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">
    <tr><td style="background:#152E38;padding:26px 32px">
      <div style="font:600 10px/1 Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#D9E0C2">Hetherington Experience</div>
      <div style="font:24px/1.25 Georgia,serif;color:#FFFFFF;padding-top:10px">${esc(d.Name || 'New response')}</div>
      ${d.Company ? `<div style="font:14px/1.4 Arial,sans-serif;color:#A7BFC7;padding-top:4px">${esc(d.Company)}</div>` : ''}
    </td></tr>
    <tr><td style="background:#F7F6F1;padding:8px 32px 30px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      <div style="font:12px/1.5 Arial,sans-serif;color:#8FA6AE;padding-top:22px">Received ${esc(d.Submitted || '')}. Reply to this email to respond to ${esc(d.Name || 'the client')} directly.</div>
    </td></tr>
  </table></td></tr></table></body></html>`;

  const text = ['HETHERINGTON EXPERIENCE: ' + (d.Name || 'New response'), '']
    .concat(FIELDS.filter(k => d[k]).map(k => `${k}: ${d[k]}`)).join('\n');

  return { html, text };
}

module.exports = async function handler(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://experience.hetherington.net.au')
    .split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  const okOrigin = !origin || allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (okOrigin && origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!okOrigin) return res.status(403).json({ ok: false, error: 'Origin not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  if (body._gotcha) return res.status(200).json({ ok: true });       // bot: pretend success
  const d = clean(body);
  if (!d.Name) return res.status(400).json({ ok: false, error: 'Name is required' });

  const { SMTP2GO_API_KEY, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP2GO_API_KEY || !MAIL_TO || !MAIL_FROM) {
    console.error('Hetherington Experience: missing SMTP2GO_API_KEY, MAIL_TO or MAIL_FROM');
    return res.status(500).json({ ok: false, error: 'Not configured' });
  }

  const { html, text } = buildEmail(d);
  const payload = {
    sender: MAIL_FROM,
    to: MAIL_TO.split(',').map(s => s.trim()).filter(Boolean),
    subject: `Hetherington Experience: ${d.Name}${d.Company ? ' (' + d.Company + ')' : ''}`,
    html_body: html,
    text_body: text
  };
  if (d.Email && isEmail(d.Email)) {
    payload.custom_headers = [{ header: 'Reply-To', value: d.Email }];
  }

  try {
    const r = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Smtp2go-Api-Key': SMTP2GO_API_KEY },
      body: JSON.stringify(payload)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.data || out.data.succeeded < 1) {
      console.error('SMTP2GO send failed', r.status, JSON.stringify(out).slice(0, 500));
      return res.status(502).json({ ok: false, error: 'Send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('SMTP2GO request error', err);
    return res.status(502).json({ ok: false, error: 'Send failed' });
  }
};

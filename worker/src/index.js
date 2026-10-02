/* Samaksh Travels mailer — emails the branded trip-summary PDF (no prices) to a customer.
   The PDF is built HERE from a fixed template, so the site (or anyone else) cannot make this service send arbitrary documents. */
import { jsPDF } from 'jspdf';
globalThis.jspdf = { jsPDF };
import '../../js/pdf-brand.js';

const MAX_BODY = 8000;
const LIMITS = { email: 2, perEmailTtl: 86400, ip: 10, perIpTtl: 3600 };
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cors(req, env) {
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const o = req.headers.get('Origin');
  return o && origins.includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : null;
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...(headers || {}) } });

async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hit(env, key, max, ttl) {
  const n = parseInt((await env.RL.get(key)) || '0', 10);
  if (n >= max) return false;
  await env.RL.put(key, String(n + 1), { expirationTtl: ttl });
  return true;
}
function b64(buf) {
  const bytes = new Uint8Array(buf); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export default {
  async fetch(req, env) {
    const c = cors(req, env);
    if (req.method === 'OPTIONS') return c ? new Response(null, { status: 204, headers: c }) : new Response(null, { status: 403 });
    if (req.method !== 'POST' || !c) return json({ ok: false, error: 'not allowed' }, 403);
    if (!env.RESEND_API_KEY || !env.RL) return json({ ok: false, error: 'not configured' }, 500, c);

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'too large' }, 413, c);
    let b; try { b = JSON.parse(raw); } catch (e) { return json({ ok: false, error: 'bad request' }, 400, c); }

    if (b.website) return json({ ok: true }, 200, c); // honeypot: pretend success to bots
    const name = clean(b.name, 80), email = clean(b.email, 100).toLowerCase(), phone = clean(b.phone, 20);
    if (name.length < 2 || !/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(email) || phone.replace(/\D/g, '').length < 10) return json({ ok: false, error: 'invalid details' }, 400, c);

    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await hit(env, 'e:' + (await sha(email)), LIMITS.email, LIMITS.perEmailTtl)) || !(await hit(env, 'i:' + (await sha(ip)), LIMITS.ip, LIMITS.perIpTtl))) return json({ ok: false, error: 'too many requests' }, 429, c);

    const P = globalThis.SamakshPDF, when = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? new Date(b.date + 'T00:00:00') : null;
    const doc = await P.summary({ name, phone, email, service: clean(b.service, 60), tier: clean(b.tier, 40), from: clean(b.from, 60), to: clean(b.to, 60),
      date: when && !isNaN(when) ? P.today(when) : 'Flexible', pax: clean(b.pax, 6), note: clean(b.note, 1000), sent: true });
    const pdf = b64(doc.output('arraybuffer'));

    const B = P.BRAND, first = esc(name.split(' ')[0]);
    const text = `Hello ${name.split(' ')[0]},\n\nThank you for your enquiry with ${B.name}. We have received your request and a member of our team will reply shortly with a clear quote.\n\nYour trip summary is attached as a PDF for your records. It is not a booking confirmation or a price quotation.\n\nFor anything urgent, WhatsApp or call ${B.phone}.\n\n${B.name}\n${B.address}\n${B.phone} | ${B.phone2}\n${B.email} | ${B.web}`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#20242c"><div style="background:#06080b;padding:18px 22px;border-bottom:3px solid #f2a950"><span style="font-family:Georgia,serif;font-size:22px;color:#eef1f5">Samaksh <i style="color:#f2a950">Travels</i></span></div><div style="padding:22px"><p>Hello ${first},</p><p>Thank you for your enquiry with ${esc(B.name)}. We have received your request and a member of our team will reply shortly with a clear quote.</p><p>Your trip summary is attached as a PDF for your records. It is not a booking confirmation or a price quotation.</p><p>For anything urgent, WhatsApp or call <b>${esc(B.phone)}</b>.</p><p style="color:#6e7682;font-size:12px;border-top:1px solid #dde1e7;padding-top:12px">${esc(B.name)} · ${esc(B.address)}<br>${esc(B.phone)} | ${esc(B.phone2)} | ${esc(B.email)} | ${esc(B.web)}</p></div></div>`;

    const r = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: [email], reply_to: env.REPLY_TO, subject: 'We received your enquiry — Samaksh Travels', text, html,
        attachments: [{ filename: 'Samaksh-Travels-Trip-Summary.pdf', content: pdf }] })
    });
    if (!r.ok) return json({ ok: false, error: 'email failed' }, 502, c);
    return json({ ok: true }, 200, c);
  }
};

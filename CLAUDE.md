# Samaksh Travels — project notes (read this first, keep edits small)

Static website (HTML/CSS/JS, no build). Live at https://samakshmahajan04.github.io/samaksh-travels/ via GitHub Pages
(repo Samakshmahajan04/samaksh-travels, branch `main`). **Publishing = commit + `git push` to main** (live in ~1 min).
Never rewrite whole files; use small targeted edits.

## Where things are
| To change | File | Look for |
|---|---|---|
| Phone, WhatsApp, email, address | `js/main.js` | `CONFIG` at the top (also visible text in `index.html`: search the number) |
| Any wording / sections / FAQ / services | `index.html` | section ids: hero, manifesto, showcase, services, destinations, packages, stats, process, enquiry, faq |
| Colours, fonts, spacing | `css/styles.css` | `:root` tokens at the top |
| 3D models, camera, terrain, lighting | `js/scene.js` | `buildPlane/buildTrain/buildHeli/buildCab/buildTempo/buildHotel` |
| Form behaviour / email delivery | `js/main.js` | `deliver()` posts to formsubmit.co -> CONFIG.email |
| Logo | `logo.svg`, `logo-full.svg`, `<symbol id="logo">` in `index.html` |
| Packages "Coming soon" | `index.html` #packages | remove `.soon` badges and "Coming soon" kickers when launched |

## Rules / gotchas
- Form email is activated for the address in CONFIG.email. If the email changes, the new address must be re-activated by sending one test enquiry.
- Destination card art is generated SVG (`data-seed`, `data-hue` on `.scenic`); replace with real photos by swapping the `<svg class="scenic">` for an `<img>`.
- Keep the page working without 3D (reduced motion / no WebGL): content must stay in the HTML.
- Test locally: `python3 -m http.server 8765` then open http://localhost:8765/ (add `?debug` to capture the WebGL canvas).
- Do not add testimonials/statistics unless real. Prices are not shown yet.

## Status log (update when anything changes)
- Domain: samakshtravels.com (bought at GoDaddy). DNS: 4 A records (GitHub Pages IPs 185.199.108-111.153) + www CNAME -> samakshmahajan04.github.io. CNAME file in repo. HTTPS enforced (Let's Encrypt, auto-renews).
- Contact: WhatsApp/call 94199 61983, 2nd 94191 61983, public/form email inquiry@samakshtravels.com (ImprovMX forwards to owner's 2 Gmails; FormSubmit must be re-activated for this address).
- SEO: Google Search Console verified (meta tag in index.html — keep it); sitemap.xml + robots.txt; sitemap showed "couldn't fetch" on 1 Oct 2026 (normal, recheck). Google Business Profile: not yet created.
- Email forwarding (inquiry@/ceo@ -> Gmail): planned via ImprovMX (MX mx1/mx2.improvmx.com prio 10/20, TXT spf `v=spf1 include:spf.improvmx.com ~all`). Status: pending user setup. Add address to contact section when working.
- Packages: "Coming soon" placeholders. No real photos/testimonials yet.
- Form posts to formsubmit.co/ajax/CONFIG.email; optional customer email gets an auto-confirmation mentioning inquiry@. Personal Gmails are not in the site code.
- WhatsApp: website messages end with '(Sent from samakshtravels.com)'. Auto-replies are set up in the WhatsApp Business app per WHATSAPP-AUTOREPLY.md (manual setup by owner; fully automated YES-flow would need the paid API).
- SEO round 1 (live 2 Oct 2026, PR #1): og-image.png/.svg + Open Graph/Twitter tags; richer TravelAgency JSON-LD (areas, 2 phones, services); new page `vaishno-devi-yatra/index.html` (own title/FAQ/JSON-LD, linked from footer); sitemap lists both pages with lastmod. TODO: request indexing in Search Console, create Google Business Profile + collect reviews, more landing pages (Udhampur-Jammu cab, Kashmir packages, Patnitop), real photos. New pages must be added to sitemap.xml.
- Destination photos: 6 CC-licensed photos from Wikimedia Commons in `images/dest-*.jpg` (credits in `images/credits.json` and the footer; keep credits if photos stay). Replace with own photos when available (same filenames). `js/main.js` generates SVG art only for `svg.scenic`.
- Security hardening (2 Oct 2026): SRI hashes on the two CDN scripts (three.js r128, lenis 1.1.13; if you change a version, recompute the sha384 hash or the script is blocked); CSP + referrer meta tags on both pages (if you add a new external domain for scripts/fonts/images/fetch, add it to the CSP); `_config.yml` excludes notes/guides (CLAUDE.md, EDITING-GUIDE.md, README.md, WHATSAPP-AUTOREPLY.md, UPDATE-GUIDE.*) from the published site; form has maxlength limits, 3s minimum fill time and 30s resend cooldown on top of the honeypot. Repo is public: never commit personal emails, keys or passwords. Owner TODO: 2FA on GitHub, GoDaddy, Gmail, ImprovMX.
- City dropdowns (2 Oct 2026): "Travelling from" / "Going to" in the enquiry form show a city list on click, filter as you type, keyboard + mouse; people can still type any place. Edit the cities in the `CITIES` array in `js/main.js` (search `data-cities`); styles `.combo-list` in `css/styles.css`.
- SEO pages round 2 (2 Oct 2026): new pages `udhampur-to-jammu-cab/`, `udhampur-to-srinagar-cab/`, `kashmir-tour-packages/` (same layout as `vaishno-devi-yatra/`: own title/description/FAQ/JSON-LD, WhatsApp+call buttons, no prices), listed in sitemap.xml and linked from the home footer; Kashmir destination card has a "Plan this trip" link. To add another page: copy one of these folders, change text/URLs/JSON-LD, add to sitemap and footer. TODO: request indexing for each in Search Console.
- PDFs (2 Oct 2026): `js/pdf-brand.js` builds branded PDFs (logo, header, footer, contact) with jsPDF 2.5.1 loaded on demand from cdnjs with an SRI hash (if the version changes, recompute the hash). (1) Visitors: "Download trip summary (PDF)" button under the enquiry form -> summary of their own details, NO prices, says it is not a quote. (2) Owner only: `tools/quote-maker.html` -> priced quotation PDF (line items, discount, inclusions/exclusions, terms, optional GSTIN). It is excluded from the published site in `_config.yml` (so nobody can make fake quotes with the brand); open it by double-clicking the file in the project folder (needs internet). Draft is kept in that browser only. PDFs use "Rs." because standard PDF fonts lack the rupee sign. TODO: owner to add real GSTIN if applicable; Level 2 (price estimates) needs the owner's rate card.
- UPDATE-GUIDE.pdf/.html: safe-update workflow (branch -> preview -> publish; one change at a time).

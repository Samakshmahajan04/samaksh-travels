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
- Form email is activated for samakshgupta48@gmail.com. If the email changes, the new address must be re-activated by sending one test enquiry.
- Destination card art is generated SVG (`data-seed`, `data-hue` on `.scenic`); replace with real photos by swapping the `<svg class="scenic">` for an `<img>`.
- Keep the page working without 3D (reduced motion / no WebGL): content must stay in the HTML.
- Test locally: `python3 -m http.server 8765` then open http://localhost:8765/ (add `?debug` to capture the WebGL canvas).
- Do not add testimonials/statistics unless real. Prices are not shown yet.

## Status log (update when anything changes)
- Domain: samakshtravels.com (bought at GoDaddy). DNS: 4 A records (GitHub Pages IPs 185.199.108-111.153) + www CNAME -> samakshmahajan04.github.io. CNAME file in repo. HTTPS enforced (Let's Encrypt, auto-renews).
- Contact: WhatsApp/call 94199 61983, 2nd 94191 61983, form email samakshgupta48@gmail.com (FormSubmit activated).
- SEO: Google Search Console verified (meta tag in index.html — keep it); sitemap.xml + robots.txt; sitemap showed "couldn't fetch" on 1 Oct 2026 (normal, recheck). Google Business Profile: not yet created.
- Email forwarding (inquiry@/ceo@ -> Gmail): planned via ImprovMX (MX mx1/mx2.improvmx.com prio 10/20, TXT spf `v=spf1 include:spf.improvmx.com ~all`). Status: pending user setup. Add address to contact section when working.
- Packages: "Coming soon" placeholders. No real photos/testimonials yet.
- Form enquiries are emailed to samakshgupta48@gmail.com with CC samakshtravels@gmail.com (`CONFIG.emailCc`, FormSubmit `_cc`). Test after any change.

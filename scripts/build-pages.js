// Runs on every Vercel deploy (and locally: SITE_URL=https://example.com node scripts/build-pages.js)
// Generates: one static page per story (with Open Graph tags for Facebook previews),
// sitemap.xml, feed.xml, robots.txt, config.js and the final index.html.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from './config.js';
import { clip, esc, fmtNepalDate, fmtNepalTime } from './lib/util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');

function siteUrl() {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    '';
  return raw.replace(/\/+$/, '');
}
const BASE = siteUrl();
if (!BASE) console.warn('⚠ SITE_URL not found: Open Graph URLs will be relative (Facebook needs absolute URLs).');

const catOf = (slug) => CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[CATEGORIES.length - 1];
const abs = (p) => `${BASE}${p}`;

const fmtDate = (ts) => `${fmtNepalDate(ts * 1000)}, ${fmtNepalTime(ts * 1000)}`;

const THEME_BOOT =
  "<script>try{var t=localStorage.getItem('np_theme');if(t)document.documentElement.dataset.theme=t;var f=localStorage.getItem('np_fs');if(f)document.documentElement.dataset.fs=f}catch(e){}</script>";

function shareHref(s) {
  const url = encodeURIComponent(abs(`/s/${s.id}`));
  const text = encodeURIComponent(s.t);
  return {
    fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    wa: `https://wa.me/?text=${text}%20${url}`,
    vb: `viber://forward?text=${text}%20${url}`,
    tg: `https://t.me/share/url?url=${url}&text=${text}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
}

function storyPage(s) {
  const cat = catOf(s.c);
  const url = abs(`/s/${s.id}`);
  const img = s.img || abs('/og-default.png');
  const desc = esc(clip(s.s || s.t, 200));
  const title = esc(s.t);
  const h = shareHref(s);
  const iso = new Date(s.ts * 1000).toISOString();
  return `<!doctype html>
<html lang="ne">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title} | ${esc(SITE_NAME)}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ne_NP">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${title}">
<meta property="article:published_time" content="${iso}">
<meta property="article:section" content="${esc(cat.name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#c8102e">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="preload" href="/fonts/noto-sans-devanagari-devanagari-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
${THEME_BOOT}
</head>
<body class="story-page" data-id="${esc(s.id)}" data-cat="${esc(s.c)}">
<header class="topbar">
  <div class="wrap bar">
    <a class="logo" href="/"><span class="logo-mark">ता</span><span class="logo-text">${esc(SITE_NAME)}</span></a>
    <div class="bar-actions">
      <a class="chip-link" href="/#/c/${esc(cat.slug)}">${cat.icon} ${esc(cat.name)}</a>
      <button class="icon-btn" id="themeBtn" aria-label="थिम परिवर्तन">◐</button>
    </div>
  </div>
</header>
<main class="wrap article">
  <article>
    <a class="cat-chip" href="/#/c/${esc(cat.slug)}">${cat.icon} ${esc(cat.name)}</a>
    <h1>${title}</h1>
    <p class="byline"><strong>${esc(s.src)}</strong> · <time datetime="${iso}" data-ts="${s.ts}">${esc(fmtDate(s.ts))}</time></p>
    ${s.img ? `<figure class="article-img"><img src="${esc(s.img)}" alt="" referrerpolicy="no-referrer" fetchpriority="high"></figure>` : ''}
    <p class="lead">${esc(s.s)}</p>
    <a class="btn-primary" href="${esc(s.u)}" target="_blank" rel="noopener nofollow">पूरा समाचार ${esc(s.src)} मा पढ्नुहोस् ↗</a>
    <div class="share-row" aria-label="सेयर गर्नुहोस्">
      <span>सेयर:</span>
      <a class="sh sh-fb" href="${esc(h.fb)}" target="_blank" rel="noopener">फेसबुक</a>
      <a class="sh sh-wa" href="${esc(h.wa)}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="sh sh-vb" href="${esc(h.vb)}">Viber</a>
      <a class="sh sh-tg" href="${esc(h.tg)}" target="_blank" rel="noopener">Telegram</a>
      <a class="sh sh-x" href="${esc(h.x)}" target="_blank" rel="noopener">X</a>
      <button class="sh" id="copyBtn" type="button">लिङ्क कपी</button>
      <button class="sh" id="saveBtn" type="button">☆ सुरक्षित</button>
    </div>
    <p class="note">सारांश स्वचालित रूपमा तयार पारिएको हो र त्रुटि हुन सक्छ। सही र पूर्ण जानकारीका लागि मूल स्रोत हेर्नुहोस्। समाचारको सबै अधिकार सम्बन्धित स्रोतको हो।</p>
  </article>
  <section class="related" id="related" hidden>
    <h2 class="sec-title">थप ${esc(cat.name)} समाचार</h2>
    <div class="rows" id="relatedList"></div>
  </section>
</main>
<footer class="footer"><div class="wrap"><a href="/">← मुख्य पृष्ठमा फर्कनुहोस्</a> · <a href="/feed.xml">RSS</a></div></footer>
<script src="/config.js"></script>
<script src="/common.js"></script>
<script src="/story.js"></script>
</body>
</html>
`;
}

async function main() {
  let data = { updated: null, stories: [] };
  try {
    data = JSON.parse(await fs.readFile(path.join(PUB, 'data', 'stories.json'), 'utf8'));
  } catch { /* none yet */ }
  const stories = Array.isArray(data.stories) ? data.stories : [];

  // story pages
  const dir = path.join(PUB, 's');
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await Promise.all(stories.map((s) => fs.writeFile(path.join(dir, `${s.id}.html`), storyPage(s))));

  // sitemap
  const urls = [
    `<url><loc>${esc(abs('/'))}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    ...stories.map(
      (s) => `<url><loc>${esc(abs(`/s/${s.id}`))}</loc><lastmod>${new Date(s.ts * 1000).toISOString()}</lastmod></url>`
    ),
  ];
  await fs.writeFile(
    path.join(PUB, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );

  // our own RSS feed
  const items = stories.slice(0, 50).map(
    (s) => `<item><title>${esc(s.t)}</title><link>${esc(abs(`/s/${s.id}`))}</link><guid isPermaLink="true">${esc(abs(`/s/${s.id}`))}</guid><pubDate>${new Date(s.ts * 1000).toUTCString()}</pubDate><category>${esc(catOf(s.c).name)}</category><description>${esc(s.s)}</description>${s.img ? `<enclosure url="${esc(s.img)}" type="image/jpeg" length="0"/>` : ''}</item>`
  );
  await fs.writeFile(
    path.join(PUB, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${esc(abs('/'))}</link><description>${esc(SITE_DESCRIPTION)}</description><language>ne</language>\n${items.join('\n')}\n</channel></rss>\n`
  );

  await fs.writeFile(path.join(PUB, 'robots.txt'), `User-agent: *\nAllow: /\n${BASE ? `Sitemap: ${BASE}/sitemap.xml\n` : ''}`);

  // client config
  const cfg = {
    siteName: SITE_NAME,
    tagline: SITE_TAGLINE,
    categories: CATEGORIES.map(({ slug, name, icon }) => ({ slug, name, icon })),
  };
  await fs.writeFile(path.join(PUB, 'config.js'), `window.NP_CONFIG=${JSON.stringify(cfg)};\n`);

  // index.html from template
  const tpl = await fs.readFile(path.join(ROOT, 'templates', 'index.template.html'), 'utf8');
  await fs.writeFile(
    path.join(PUB, 'index.html'),
    tpl
      .replaceAll('{{SITE_URL}}', BASE)
      .replaceAll('{{SITE_NAME}}', esc(SITE_NAME))
      .replaceAll('{{SITE_TAGLINE}}', esc(SITE_TAGLINE))
      .replaceAll('{{SITE_DESCRIPTION}}', esc(SITE_DESCRIPTION))
  );

  console.log(`Built ${stories.length} story pages. Site URL: ${BASE || '(relative)'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

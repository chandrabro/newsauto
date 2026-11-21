// Hourly job: collect RSS -> categorise & summarise with Gemini -> save public/data/stories.json
// Run:  GEMINI_API_KEY=xxxx node scripts/update.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { CATEGORIES, DEFAULT_CATEGORY, FEEDS, SETTINGS } from './config.js';
import { clip, decodeEntities, idFor, normalizeUrl, sleep, stripHtml } from './lib/util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'public', 'data', 'stories.json');
const UA = 'Mozilla/5.0 (compatible; NepalTajaBot/1.0; +news-aggregator)';
const NOW = Date.now();
const CAT_SLUGS = CATEGORIES.map((c) => c.slug);

// FEEDS_OVERRIDE="http://a/x.xml|ne,http://b/y.xml|en" lets you test with local files.
const feeds = process.env.FEEDS_OVERRIDE
  ? process.env.FEEDS_OVERRIDE.split(',').map((s, i) => {
      const [url, lang = 'ne'] = s.trim().split('|');
      return { name: `Test ${i + 1}`, url, lang };
    })
  : FEEDS;

// ------------------------------------------------------------ helpers
async function fetchText(url, timeout = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'user-agent': UA,
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
        'accept-language': 'ne,en;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const txt = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return txt(v[0]);
  if (typeof v === 'object') return txt(v['#text']);
  return '';
};

function absUrl(candidate, base) {
  try {
    const u = new URL(decodeEntities(String(candidate).trim()), base);
    if (!/^https?:$/.test(u.protocol)) return '';
    if (u.protocol === 'http:') u.protocol = 'https:';
    return u.toString();
  } catch {
    return '';
  }
}

function linkOf(it) {
  let l = it.link;
  if (Array.isArray(l)) l = l.find((x) => x?.['@_rel'] === 'alternate') || l[0];
  if (l && typeof l === 'object') return l['@_href'] || txt(l);
  return txt(l) || txt(it.guid);
}

function imageOf(it, base) {
  const c = [];
  for (const m of asArray(it['media:content'])) {
    if (m?.['@_url'] && !/video|audio/.test(m['@_type'] || '') && (!m['@_medium'] || m['@_medium'] === 'image')) c.push(m['@_url']);
  }
  for (const m of asArray(it['media:thumbnail'])) if (m?.['@_url']) c.push(m['@_url']);
  for (const e of asArray(it.enclosure)) if (e?.['@_url'] && /image/.test(e['@_type'] || 'image')) c.push(e['@_url']);
  const html = [txt(it['content:encoded']), txt(it.description), txt(it.content), txt(it.summary)].join(' ');
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) c.push(m[1]);
  for (const x of c) {
    const u = absUrl(x, base);
    if (u && !/(pixel|spacer|blank|1x1|logo)/i.test(u)) return u;
  }
  return '';
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', trimValues: true });

function parseFeed(xml, feed) {
  const j = parser.parse(xml);
  const items = asArray(j?.rss?.channel?.item ?? j?.feed?.entry ?? j?.['rdf:RDF']?.item);
  const out = [];
  for (const it of items.slice(0, SETTINGS.perFeedLimit)) {
    const link = absUrl(linkOf(it), feed.url);
    const title = stripHtml(txt(it.title));
    if (!link || !title) continue;
    const when = Date.parse(txt(it.pubDate) || txt(it['dc:date']) || txt(it.published) || txt(it.updated));
    out.push({
      url: normalizeUrl(link),
      title,
      desc: clip(stripHtml(txt(it.description) || txt(it.summary) || txt(it['content:encoded'])), 500),
      image: imageOf(it, link),
      ts: Number.isFinite(when) && when <= NOW + 3600e3 ? Math.floor(when / 1000) : Math.floor(NOW / 1000),
      source: feed.name,
      lang: feed.lang,
    });
  }
  return out;
}

// ------------------------------------------------------------ categorisation
function fallbackCategory(item) {
  const hay = `${item.title} ${item.desc}`.toLowerCase();
  let best = DEFAULT_CATEGORY;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      const k = kw.toLowerCase();
      const hit = /^[a-z0-9 ]+$/.test(k) ? new RegExp(`\\b${k}\\b`).test(hay) : hay.includes(k);
      if (hit) score += 1;
    }
    if (score > bestScore) { best = cat.slug; bestScore = score; }
  }
  return best;
}

const clampInt = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.min(hi, Math.max(lo, Math.round(+n))) : d);

async function callGemini(batch) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const catList = CATEGORIES.map((c) => `- ${c.slug}: ${c.name} (${c.hint})`).join('\n');
  const prompt = `तपाईं एक अनुभवी नेपाली समाचार सम्पादक हुनुहुन्छ। तल दिइएका समाचारहरूलाई प्रशोधन गर्नुहोस्।

प्रत्येक समाचारका लागि फर्काउनुहोस्:
- id: जस्ताको तस्तै
- category: तलका मध्ये एउटा slug मात्र
${catList}
- title: नेपाली (देवनागरी) शीर्षक। मूल शीर्षक नेपालीमा छ भने जस्ताको तस्तै राख्नुहोस्; अंग्रेजी भए स्वाभाविक नेपालीमा अनुवाद गर्नुहोस्।
- summary: १–२ वाक्यको नेपाली सारांश (१६० अक्षर भित्र)। दिइएको शीर्षक र पाठबाहेक कुनै नयाँ तथ्य, नाम, संख्या वा मिति नथप्नुहोस्। विवरण अपुग भए शीर्षकको भाव बुझाउने छोटो वाक्य लेख्नुहोस्।
- importance: १–१० को अंक (१० = राष्ट्रिय/अन्तर्राष्ट्रिय स्तरको ठूलो समाचार, ५ = सामान्य, १ = राशिफल/विज्ञापन/प्रायोजित/महत्त्वहीन)
- event: घटनाको २–४ शब्दको नेपाली लेबल। एउटै घटनाका फरक स्रोतका समाचारमा एउटै लेबल प्रयोग गर्नुहोस्।

समाचार (JSON):
${JSON.stringify(batch.map((b) => ({ id: b.id, source: b.source, title: b.title, text: b.desc })))}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            category: { type: 'STRING', enum: CAT_SLUGS },
            title: { type: 'STRING' },
            summary: { type: 'STRING' },
            importance: { type: 'INTEGER' },
            event: { type: 'STRING' },
          },
          required: ['id', 'category', 'title', 'summary', 'importance', 'event'],
        },
      },
    },
  };

  const models = [...new Set([process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${process.env.GEMINI_BASE || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(90000),
        });
        if (res.status === 429 || res.status >= 500) {
          console.warn(`  Gemini ${model}: HTTP ${res.status}, retrying…`);
          await sleep(5000 * (attempt + 1));
          continue;
        }
        if (!res.ok) {
          console.warn(`  Gemini ${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
          break; // try the next model
        }
        const data = await res.json();
        const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) return arr;
      } catch (e) {
        console.warn(`  Gemini ${model}: ${e.message}`);
        await sleep(2000);
      }
    }
  }
  return null;
}

async function enrich(newItems) {
  const result = new Map();
  for (let i = 0; i < newItems.length; i += SETTINGS.batchSize) {
    const batch = newItems.slice(i, i + SETTINGS.batchSize);
    const answer = await callGemini(batch);
    if (answer) {
      for (const a of answer) if (a && typeof a.id === 'string') result.set(a.id, a);
    }
    if (i + SETTINGS.batchSize < newItems.length) await sleep(1500);
  }
  return result;
}

// ------------------------------------------------------------ og:image lookup
async function findOgImage(url) {
  try {
    const html = (await fetchText(url, 8000)).slice(0, 300000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    return m ? absUrl(m[1], url) : '';
  } catch {
    return '';
  }
}

async function pool(items, limit, fn) {
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (idx < items.length) {
        const mine = items[idx++];
        await fn(mine);
      }
    })
  );
}

// ------------------------------------------------------------ main
async function main() {
  let store = { updated: null, stories: [] };
  try {
    store = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(store.stories)) store.stories = [];
  } catch { /* first run */ }

  const known = new Set(store.stories.map((s) => s.id));
  const knownTitles = new Set(store.stories.flatMap((s) => [s.t, s.o].filter(Boolean)));

  // 1. collect
  let okFeeds = 0;
  const all = [];
  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const items = parseFeed(await fetchText(feed.url), feed);
        okFeeds++;
        all.push(...items);
        console.log(`✓ ${feed.name}: ${items.length} items`);
      } catch (e) {
        console.warn(`✗ ${feed.name}: ${e.message}`);
      }
    })
  );
  if (okFeeds === 0) {
    console.error('No feed could be read. Keeping the old data.');
    process.exit(1);
  }

  // 2. pick new items
  const minTs = Math.floor(NOW / 1000) - SETTINGS.maxAgeHours * 3600;
  const seenNow = new Set();
  const seenTitles = new Set();
  const fresh = [];
  for (const it of all.sort((a, b) => b.ts - a.ts)) {
    const id = idFor(it.url);
    if (known.has(id) || seenNow.has(id) || it.ts < minTs || knownTitles.has(it.title) || seenTitles.has(it.title)) continue;
    seenNow.add(id);
    seenTitles.add(it.title);
    fresh.push({ ...it, id });
  }
  const newItems = fresh.slice(0, SETTINGS.maxNewPerRun);
  console.log(`New stories: ${fresh.length} (processing ${newItems.length})`);

  // 3. categorise + summarise
  const ai = newItems.length ? await enrich(newItems) : new Map();
  if (!process.env.GEMINI_API_KEY) console.log('GEMINI_API_KEY not set → using keyword categorisation.');

  const built = newItems.map((it) => {
    const a = ai.get(it.id);
    const category = a && CAT_SLUGS.includes(a.category) ? a.category : fallbackCategory(it);
    const t = clip(a?.title?.trim() || it.title, 200);
    return {
      id: it.id,
      t,
      ...(t !== it.title ? { o: it.title } : {}),
      s: clip(a?.summary?.trim() || it.desc || '', 220),
      c: category,
      i: clampInt(a?.importance, 1, 10, 5),
      e: a?.event ? clip(String(a.event).trim(), 40) : '',
      u: it.url,
      src: it.source,
      img: it.image,
      ts: it.ts,
    };
  });

  // 4. fill missing images from the article page (needed for Facebook previews)
  const needImg = built.filter((b) => !b.img).sort((a, b) => b.i - a.i).slice(0, SETTINGS.maxImageLookups);
  if (needImg.length) {
    await pool(needImg, 5, async (b) => { b.img = await findOgImage(b.u); });
    console.log(`Image lookups: ${needImg.filter((b) => b.img).length}/${needImg.length} found`);
  }

  // 5. merge, prune, save
  const cutoff = Math.floor(NOW / 1000) - SETTINGS.keepHours * 3600;
  const merged = [...built, ...store.stories]
    .filter((s) => s.ts >= cutoff)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, SETTINGS.maxStored);

  const out = { updated: new Date(NOW).toISOString(), count: merged.length, stories: merged };
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(out));
  console.log(`Saved ${merged.length} stories (${built.length} new).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import crypto from 'node:crypto';

const NEP_DIGITS = '०१२३४५६७८९';
export const nepDigits = (v) => String(v).replace(/\d/g, (d) => NEP_DIGITS[d]);

export function esc(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };
export function decodeEntities(s = '') {
  return String(s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

export function stripHtml(html = '') {
  return decodeEntities(
    String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    for (const k of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref$)/i.test(k)) url.searchParams.delete(k);
    }
    let s = url.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s.replace(/^http:\/\//, 'https://');
  } catch {
    return String(u || '').trim();
  }
}

export const idFor = (url) => crypto.createHash('sha1').update(normalizeUrl(url)).digest('hex').slice(0, 12);

export function clip(s = '', n = 200) {
  s = String(s).trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[,\s।.\-–—]+$/, '') + '…';
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Nepal is UTC+5:45 all year (no daylight saving), so we can format by hand and
// not depend on the server/browser having Nepali locale data.
const WD = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
const MO = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];
export function fmtNepalDate(ms, withWeekday = false) {
  const d = new Date(ms + 5.75 * 3600e3);
  return `${withWeekday ? WD[d.getUTCDay()] + ', ' : ''}${nepDigits(d.getUTCDate())} ${MO[d.getUTCMonth()]} ${nepDigits(d.getUTCFullYear())}`;
}
export function fmtNepalTime(ms) {
  const d = new Date(ms + 5.75 * 3600e3);
  const h = d.getUTCHours();
  const period = h >= 4 && h < 12 ? 'बिहान' : h >= 12 && h < 16 ? 'दिउँसो' : h >= 16 && h < 20 ? 'साँझ' : 'राति';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${nepDigits(h12)}:${nepDigits(String(d.getUTCMinutes()).padStart(2, '0'))} बजे`;
}

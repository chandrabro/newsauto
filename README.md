# नेपाल ताजा — self-updating Nepali news website

Every hour a GitHub Action reads Nepali news RSS feeds, asks **Gemini** to categorise each story and write a short Nepali summary, and saves the result. **Vercel** redeploys automatically and rebuilds a share-ready page for every story (so Facebook shows the image preview).

```
GitHub Actions (hourly) → scripts/update.js → public/data/stories.json → commit
                                                        ↓
                          Vercel redeploys → scripts/build-pages.js → /s/<id> pages with og:image
```

## Setup (about 15 minutes, all free)

### 1. Put the code on GitHub
1. Create a free account at github.com, then **New repository** (name e.g. `nepal-taja`, Public or Private).
2. Upload everything from this folder (**Add file → Upload files**). Do not upload `node_modules`.
3. The hidden folder `.github/workflows/update.yml` is sometimes skipped by drag‑and‑drop. If you don't see it in your repo: **Add file → Create new file**, type the name `.github/workflows/update.yml`, and paste the contents of `update-workflow.yml` from this folder.

### 2. Add the Gemini key (as a secret, never in code)
1. Get a key at https://aistudio.google.com/apikey
2. In the repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `GEMINI_API_KEY` · Value: your key

### 3. Deploy on Vercel
1. Go to vercel.com, sign in with GitHub, click **Add New → Project**, pick the repo, click **Deploy**. No settings need changing (`vercel.json` handles them).
2. You get an address like `nepal-taja.vercel.app`.

### 4. Run the first update
In the repo open **Actions → Update news → Run workflow**. After ~1 minute it commits fresh news, Vercel redeploys, and the site fills up. From then on it runs by itself every hour.

## Facebook preview
Each story has its own page: `https://your-site/s/<id>` with Open Graph tags (title, summary, image). The share buttons on the site always share this address, so pasting it into Facebook shows the picture, headline and summary.
- If a story's source has no picture, the site's default banner (`public/og-default.png`) is used.
- To refresh a preview Facebook cached earlier: https://developers.facebook.com/tools/debug/ → paste link → **Scrape Again**.
- Using your own domain? Add an environment variable `SITE_URL` (e.g. `https://example.com`) in Vercel → Settings → Environment Variables.

## Customising
Everything is in `scripts/config.js`:
- `SITE_NAME`, `SITE_TAGLINE`
- `CATEGORIES` (add / rename / reorder; also edit the matching keywords)
- `FEEDS` (add or remove news sources — a broken feed is skipped automatically)
- `SETTINGS` (how many hours to keep, how many stories per run, …)

The Gemini model is `gemini-2.5-flash` by default (falls back to `gemini-2.5-flash-lite`). To use a newer one, add a repository **variable** (Settings → Secrets and variables → Actions → Variables) named `GEMINI_MODEL`.

If `GEMINI_API_KEY` is missing or Gemini is down, the site still updates using simple keyword categorisation and the original summaries.

## Things worth knowing
- **GitHub's schedule is approximate**: runs can start a few minutes late, and GitHub may pause scheduled runs in repos with no activity for 60 days (press *Run workflow* once to resume).
- **Vercel free (Hobby) plan** allows 100 deployments/day; one per hour is 24, so there is plenty of room. Hobby is meant for non-commercial use — if you start earning from the site (ads), check Vercel's current terms.
- **Content**: the site shows only headlines, a short AI summary and a link to the original article. Keep it that way and always credit the source. Show-the-full-article would raise copyright problems.
- Summaries are written by AI from the feed text; occasional mistakes are possible, which is why every story links to its source.

## Test locally
```bash
npm install
GEMINI_API_KEY=xxx node scripts/update.js
SITE_URL=http://localhost:3000 node scripts/build-pages.js
npx serve public
```

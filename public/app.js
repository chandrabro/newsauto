/* नेपाल ताजा — main app (hash-routed, no framework) */
(function () {
  var N = window.NP, esc = N.esc, nep = N.nep, catOf = N.catOf, timeAgo = N.timeAgo, cats = N.cfg.categories || [];
  var $ = function (s) { return document.querySelector(s); };
  var app = $('#app');
  var DATA = { updated: null, stories: [] };
  var PAGE = 24;

  /* ---------- ranking helpers ---------- */
  var age = function (s) { return (Date.now() / 1000 - s.ts) / 3600; };
  var score = function (s) { return (s.i || 5) - age(s) / 6; };
  var byScore = function (a, b) { return score(b) - score(a); };
  var byTime = function (a, b) { return b.ts - a.ts; };
  function uniqueEvents(list) {
    var seen = {};
    return list.filter(function (s) {
      var k = (s.e || '').trim() || s.id;
      if (seen[k]) return false;
      seen[k] = 1; return true;
    });
  }
  var find = function (id) {
    return DATA.stories.find(function (s) { return s.id === id; }) ||
      N.saved.list().find(function (s) { return s.id === id; });
  };

  /* ---------- templates ---------- */
  function thumb(s) {
    var c = catOf(s.c);
    return '<div class="thumb ' + (s.img ? '' : 'noimg') + '" data-ic="' + c.icon + '">' +
      (s.img ? '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="' + esc(s.img) + '" alt="">' : '') + '</div>';
  }
  function meta(s) {
    return '<span class="meta"><span class="src">' + esc(s.src) + '</span><span>·</span><time>' + timeAgo(s.ts) + '</time>' +
      (age(s) < 1 ? '<span class="badge-new">नयाँ</span>' : '') + '</span>';
  }
  function acts(s) {
    var on = N.saved.has(s.id);
    return '<span class="acts">' +
      '<button class="act" data-act="share" data-id="' + s.id + '" aria-label="सेयर गर्नुहोस्">⤴</button>' +
      '<button class="act ' + (on ? 'on' : '') + '" data-act="save" data-id="' + s.id + '" aria-label="सुरक्षित गर्नुहोस्">' + (on ? '★' : '☆') + '</button></span>';
  }
  function card(s) {
    var c = catOf(s.c);
    return '<article class="card"><a class="card-link" href="/s/' + s.id + '">' + thumb(s) +
      '<div class="card-body"><span class="kicker">' + c.icon + ' ' + esc(c.name) + '</span><h3>' + esc(s.t) + '</h3>' +
      (s.s ? '<p class="sum">' + esc(s.s) + '</p>' : '') + '</div></a>' +
      '<div class="card-foot">' + meta(s) + acts(s) + '</div></article>';
  }
  function row(s) {
    return '<article class="row"><a class="row-link" href="/s/' + s.id + '"><h3>' + esc(s.t) + '</h3>' + thumb(s) + '</a>' +
      '<div class="row-foot">' + meta(s) + acts(s) + '</div></article>';
  }
  function hero(s) {
    var c = catOf(s.c);
    return '<a class="hero-main" href="/s/' + s.id + '">' + thumb(s) +
      '<div class="over"><span class="kicker">' + c.icon + ' ' + esc(c.name) + '</span><h2>' + esc(s.t) + '</h2>' + meta(s) + '</div></a>';
  }
  function secHead(title, href, more) {
    return '<div class="sec-head"><h2 class="sec-title">' + title + '</h2>' + (href ? '<a class="sec-more" href="' + href + '">' + (more || 'थप हेर्नुहोस्') + ' →</a>' : '') + '</div>';
  }
  function empty(title, text) { return '<div class="empty"><b>' + title + '</b>' + text + '</div>'; }

  /* ---------- views ---------- */
  function home() {
    var list = DATA.stories;
    if (!list.length) {
      app.innerHTML = empty('समाचार तयार हुँदैछ…', 'पहिलो अपडेट आउन केही मिनेट लाग्न सक्छ। कृपया केही बेरपछि फेरि हेर्नुहोस्।');
      return;
    }
    var recent = list.filter(function (s) { return age(s) < 30; });
    var ranked = uniqueEvents((recent.length >= 5 ? recent : list).slice().sort(byScore));
    var top = ranked.slice(0, 6).find(function (s) { return s.img; }) || ranked[0];
    var side = ranked.filter(function (s) { return s.id !== top.id; }).slice(0, 3);
    var latest = list.slice().sort(byTime).slice(0, 10);
    var digest = ranked.slice(0, 5);

    var html = '<section class="hero">' + hero(top) + '<div class="hero-side">' + side.map(row).join('') + '</div></section>';

    html += '<div class="two-col"><section>' + secHead('ताजा अपडेट', '#/latest', 'सबै ताजा') +
      '<div class="rows">' + latest.map(row).join('') + '</div></section>' +
      '<aside><div class="sec-head"><h2 class="sec-title">आजका मुख्य ५</h2></div><div class="digest"><ol>' +
      digest.map(function (s) {
        return '<li><div><a href="/s/' + s.id + '">' + esc(s.t) + '</a><div class="meta">' + esc(s.src) + ' · ' + timeAgo(s.ts) + '</div></div></li>';
      }).join('') + '</ol></div></aside></div>';

    cats.forEach(function (c) {
      var items = uniqueEvents(list.filter(function (s) { return s.c === c.slug; }).sort(byScore)).slice(0, 5);
      if (!items.length) return;
      html += secHead(c.icon + ' ' + esc(c.name), '#/c/' + c.slug) +
        '<div class="cat-block">' + card(items[0]) + '<div class="rows">' + items.slice(1).map(row).join('') + '</div></div>';
    });
    app.innerHTML = html;
  }

  function listView(o) {
    var shown = PAGE, sort = o.sort || 'time', src = '';
    var sources = Array.from(new Set(o.items.map(function (s) { return s.src; }))).sort();
    app.innerHTML =
      '<section><div class="view-head"><h1>' + o.title + '</h1>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' +
      (o.filters && o.items.length ? '<div class="filters"><select id="fSort" aria-label="क्रम"><option value="time">नयाँ पहिले</option><option value="score">महत्त्वपूर्ण पहिले</option></select>' +
        '<select id="fSrc" aria-label="स्रोत"><option value="">सबै स्रोत</option>' + sources.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div>' : '') +
      '<div class="grid" id="grid"></div><div class="more" id="more"></div></section>';
    var grid = $('#grid'), more = $('#more');
    function draw() {
      var L = o.items.filter(function (s) { return !src || s.src === src; }).sort(sort === 'time' ? byTime : byScore);
      grid.innerHTML = L.slice(0, shown).map(card).join('') || '';
      if (!L.length) grid.outerHTML = '<div id="grid">' + empty(o.emptyTitle || 'कुनै समाचार भेटिएन', o.emptyText || '') + '</div>';
      more.innerHTML = L.length > shown ? '<button class="btn-ghost" id="moreBtn">थप समाचार (' + nep(L.length - shown) + ')</button>' : '';
      var mb = $('#moreBtn'); if (mb) mb.onclick = function () { shown += PAGE; draw(); };
    }
    var fs = $('#fSort'), fr = $('#fSrc');
    if (fs) { fs.value = sort; fs.onchange = function () { sort = fs.value; shown = PAGE; draw(); }; }
    if (fr) fr.onchange = function () { src = fr.value; shown = PAGE; draw(); };
    draw();
  }

  function norm(s) { return String(s).toLowerCase().replace(/[०-९]/g, function (d) { return '०१२३४५६७८९'.indexOf(d); }); }
  function searchView(term) {
    var words = norm(term).split(/\s+/).filter(Boolean);
    var items = DATA.stories.filter(function (s) {
      var hay = norm(s.t + ' ' + s.s + ' ' + s.src + ' ' + catOf(s.c).name);
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    listView({
      title: '“' + esc(term) + '” को खोज', sub: nep(items.length) + ' समाचार भेटिए', items: items, sort: 'time',
      emptyTitle: 'कुनै समाचार भेटिएन', emptyText: 'अर्को शब्दले खोजेर हेर्नुहोस्।',
    });
  }

  /* ---------- router ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    try { h = decodeURIComponent(h); } catch (e) {}
    var parts = h.split('/');
    return { name: parts[0] || '', arg: parts.slice(1).join('/') };
  }
  function setTitle(t) { document.title = t ? t + ' | ' + N.cfg.siteName : N.cfg.siteName + ' — ' + N.cfg.tagline; }

  function route(keepScroll) {
    var r = parseHash();
    var key = r.name === 'c' ? 'c/' + r.arg : r.name === 'q' ? '' : r.name;
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.k === key); });
    var sb = $('#searchbar'), q = $('#q');
    if (r.name === 'q') { sb.hidden = false; if (q.value !== r.arg) q.value = r.arg; }

    if (r.name === 'c') {
      var c = catOf(r.arg);
      var items = DATA.stories.filter(function (s) { return s.c === r.arg; });
      listView({ title: c.icon + ' ' + esc(c.name), sub: nep(items.length) + ' समाचार', items: items, filters: true, emptyTitle: 'यो वर्गमा अहिले समाचार छैन', emptyText: 'अर्को अपडेटमा हेर्नुहोस्।' });
      setTitle(c.name);
    } else if (r.name === 'latest') {
      listView({ title: '🕒 ताजा समाचार', sub: 'सबै वर्गका नयाँ समाचार', items: DATA.stories, filters: true });
      setTitle('ताजा समाचार');
    } else if (r.name === 'saved') {
      var sv = N.saved.list();
      listView({ title: '🔖 सुरक्षित समाचार', sub: 'यो उपकरणमा मात्र सुरक्षित हुन्छ', items: sv, emptyTitle: 'कुनै समाचार सुरक्षित गरिएको छैन', emptyText: 'समाचारमा ☆ थिचेर पछि पढ्नका लागि सुरक्षित गर्नुहोस्।' });
      setTitle('सुरक्षित समाचार');
    } else if (r.name === 'q' && r.arg.trim()) {
      searchView(r.arg.trim()); setTitle('खोज: ' + r.arg);
    } else {
      home(); setTitle('');
    }
    if (!keepScroll) window.scrollTo(0, 0);
  }

  /* ---------- chrome: nav, ticker, status ---------- */
  function buildNav() {
    var tabs = [{ k: '', href: '#/', label: 'मुख्य' }, { k: 'latest', href: '#/latest', label: '🕒 ताजा' }]
      .concat(cats.map(function (c) { return { k: 'c/' + c.slug, href: '#/c/' + c.slug, label: c.name }; }))
      .concat([{ k: 'saved', href: '#/saved', label: '🔖 सुरक्षित' }]);
    $('#nav .wrap').innerHTML = tabs.map(function (t) {
      return '<a href="' + t.href + '" data-k="' + t.k + '">' + t.label + '</a>';
    }).join('');
  }
  function buildTicker() {
    var list = DATA.stories.filter(function (s) { return age(s) < 12; }).sort(byScore).slice(0, 10);
    if (list.length < 4) list = DATA.stories.slice().sort(byTime).slice(0, 8);
    var t = $('#ticker');
    if (!list.length) { t.hidden = true; return; }
    var html = list.map(function (s) { return '<a href="/s/' + s.id + '">' + esc(s.t) + '</a>'; }).join('');
    $('#tickerInner').innerHTML = html + html;
    t.hidden = false;
  }
  function buildStatus() {
    var u = '';
    if (DATA.updated) {
      var ms = new Date(DATA.updated).getTime();
      u = 'अन्तिम अपडेट: <b>' + N.fmtTime(ms) + '</b> (' + timeAgo(ms / 1000) + ') · हरेक घण्टा आफैँ अपडेट';
    }
    $('#status').innerHTML = '<span>📅 ' + esc(N.fmtDate(Date.now())) + '</span><span>' + u + '</span>';
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    e.preventDefault();
    var s = find(b.dataset.id);
    if (!s) return;
    if (b.dataset.act === 'share') N.share(s);
    if (b.dataset.act === 'save') {
      var on = N.saved.toggle(s);
      b.classList.toggle('on', on); b.textContent = on ? '★' : '☆';
      N.toast(on ? 'सुरक्षित गरियो' : 'सुरक्षितबाट हटाइयो');
      if (parseHash().name === 'saved') route(true);
    }
  });
  // broken images -> gradient + emoji placeholder
  document.addEventListener('error', function (e) {
    var im = e.target;
    if (im && im.tagName === 'IMG' && im.parentElement && im.parentElement.classList.contains('thumb')) {
      im.parentElement.classList.add('noimg'); im.remove();
    }
  }, true);

  var qT;
  $('#searchBtn').onclick = function () {
    var sb = $('#searchbar'); sb.hidden = !sb.hidden;
    if (!sb.hidden) $('#q').focus(); else if (parseHash().name === 'q') location.hash = '#/';
  };
  $('#q').addEventListener('input', function (e) {
    clearTimeout(qT);
    qT = setTimeout(function () {
      var v = e.target.value.trim();
      history.replaceState(null, '', v ? '#/q/' + encodeURIComponent(v) : '#/');
      route(true);
    }, 250);
  });
  $('#q').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.target.blur(); });
  window.addEventListener('hashchange', function () { route(false); });

  var deferred;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
  $('#installBtn').onclick = function () { if (deferred) { deferred.prompt(); deferred = null; $('#installBtn').hidden = true; } };

  /* ---------- data loading ---------- */
  function load(first) {
    return N.loadStories().then(function (d) {
      var changed = d.updated !== DATA.updated;
      DATA = { updated: d.updated, stories: d.stories || [] };
      buildStatus();
      if (first || changed) {
        buildTicker();
        var searching = parseHash().name === 'q';
        if (first || !searching) route(!first);
        if (!first) N.toast('समाचार अपडेट भयो');
      }
    }).catch(function () {
      if (first) app.innerHTML = empty('समाचार लोड हुन सकेन', '<button class="btn-ghost" id="retry">फेरि प्रयास गर्नुहोस्</button>');
      var r = $('#retry'); if (r) r.onclick = function () { load(true); };
    });
  }

  buildNav();
  load(true);
  setInterval(function () { if (!document.hidden) load(false); }, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(false); });
})();

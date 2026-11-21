/* Shared helpers: theme, font size, share sheet, bookmarks, time formatting */
(function () {
  var cfg = window.NP_CONFIG || { siteName: 'नेपाल ताजा', categories: [] };
  var ND = '०१२३४५६७८९';
  var nep = function (v) { return String(v).replace(/\d/g, function (d) { return ND[d]; }); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var catOf = function (slug) {
    var list = cfg.categories || [];
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return list[list.length - 1] || { slug: slug, name: '', icon: '📰' };
  };
  function timeAgo(ts) {
    var d = Math.max(0, Date.now() / 1000 - ts);
    if (d < 90) return 'भर्खरै';
    if (d < 3600) return nep(Math.round(d / 60)) + ' मिनेट अगाडि';
    if (d < 86400) return nep(Math.floor(d / 3600)) + ' घण्टा अगाडि';
    return nep(Math.floor(d / 86400)) + ' दिन अगाडि';
  }

  var WD = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
  var MO = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];
  function fmtDate(ms) {
    var d = new Date(ms + 5.75 * 3600e3);
    return WD[d.getUTCDay()] + ', ' + nep(d.getUTCDate()) + ' ' + MO[d.getUTCMonth()] + ' ' + nep(d.getUTCFullYear());
  }
  function fmtTime(ms) {
    var d = new Date(ms + 5.75 * 3600e3), h = d.getUTCHours();
    var period = h >= 4 && h < 12 ? 'बिहान' : h >= 12 && h < 16 ? 'दिउँसो' : h >= 16 && h < 20 ? 'साँझ' : 'राति';
    return period + ' ' + nep(h % 12 === 0 ? 12 : h % 12) + ':' + nep(String(d.getUTCMinutes()).padStart(2, '0')) + ' बजे';
  }

  /* ---------- storage ---------- */
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var SAVED_KEY = 'np_saved_v1';
  var saved = {
    list: function () { return lsGet(SAVED_KEY, []); },
    has: function (id) { return saved.list().some(function (s) { return s.id === id; }); },
    toggle: function (s) {
      var l = saved.list();
      var i = l.findIndex(function (x) { return x.id === s.id; });
      if (i >= 0) { l.splice(i, 1); lsSet(SAVED_KEY, l); return false; }
      l.unshift({ id: s.id, t: s.t, s: s.s, c: s.c, i: s.i || 5, u: s.u, src: s.src, img: s.img || '', ts: s.ts });
      lsSet(SAVED_KEY, l.slice(0, 100));
      return true;
    },
  };

  /* ---------- toast ---------- */
  var tt;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  /* ---------- share ---------- */
  var storyUrl = function (s) { return location.origin + '/s/' + s.id; };
  function copy(text) {
    var done = function () { toast('लिङ्क कपी भयो ✓'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('कपी गर्न सकिएन'); }
      ta.remove();
    }
  }
  function openShare(s) {
    var url = storyUrl(s), u = encodeURIComponent(url), t = encodeURIComponent(s.t);
    var el = document.getElementById('sheet');
    if (!el) { el = document.createElement('div'); el.id = 'sheet'; document.body.appendChild(el); }
    el.className = 'sheet';
    el.innerHTML =
      '<div class="sheet-bg" data-close></div><div class="sheet-box" role="dialog" aria-label="सेयर गर्नुहोस्">' +
      '<div class="sheet-title">' + esc(s.t) + '</div><div class="sheet-grid">' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener"><b>📘</b>फेसबुक</a>' +
      '<a href="https://wa.me/?text=' + t + '%20' + u + '" target="_blank" rel="noopener"><b>💬</b>WhatsApp</a>' +
      '<a href="viber://forward?text=' + t + '%20' + u + '"><b>📞</b>Viber</a>' +
      '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener"><b>✈️</b>Telegram</a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + t + '&url=' + u + '" target="_blank" rel="noopener"><b>𝕏</b>X</a>' +
      '<button type="button" data-copy="' + esc(url) + '"><b>🔗</b>लिङ्क कपी</button>' +
      '</div></div>';
    el.onclick = function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) { copy(c.getAttribute('data-copy')); el.remove(); return; }
      if (e.target.closest('[data-close]') || e.target.closest('a')) el.remove();
    };
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var el = document.getElementById('sheet'); if (el) el.remove(); }
  });
  function share(s) {
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile && navigator.share) {
      navigator.share({ title: s.t, text: s.t, url: storyUrl(s) }).catch(function () {});
    } else openShare(s);
  }

  /* ---------- theme & font size ---------- */
  function effectiveTheme() {
    return document.documentElement.dataset.theme ||
      (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#themeBtn')) {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('np_theme', next); } catch (x) {}
    }
    if (e.target.closest('#fsBtn')) {
      var cur = parseInt(document.documentElement.dataset.fs || '0', 10);
      var n = (cur + 1) % 3;
      document.documentElement.dataset.fs = String(n);
      try { localStorage.setItem('np_fs', String(n)); } catch (x) {}
      toast(['सामान्य अक्षर', 'ठूलो अक्षर', 'धेरै ठूलो अक्षर'][n]);
    }
  });

  /* ---------- data ---------- */
  function loadStories() {
    return fetch('/data/stories.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- offline / PWA ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

  window.NP = {
    cfg: cfg, nep: nep, esc: esc, catOf: catOf, timeAgo: timeAgo, fmtDate: fmtDate, fmtTime: fmtTime, toast: toast, copy: copy,
    saved: saved, share: share, storyUrl: storyUrl, loadStories: loadStories,
  };
})();

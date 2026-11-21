/* Story page behaviour: save/share buttons + related stories */
(function () {
  var N = window.NP, esc = N.esc;
  var body = document.body;
  var timeEl = document.querySelector('time[data-ts]');
  var imgEl = document.querySelector('.article-img img');
  var story = {
    id: body.dataset.id,
    c: body.dataset.cat,
    t: document.querySelector('h1').textContent,
    s: (document.querySelector('.lead') || {}).textContent || '',
    u: document.querySelector('.btn-primary').getAttribute('href'),
    src: (document.querySelector('.byline strong') || {}).textContent || '',
    img: imgEl ? imgEl.getAttribute('src') : '',
    ts: timeEl ? parseInt(timeEl.dataset.ts, 10) : Math.floor(Date.now() / 1000),
    i: 5,
  };

  if (timeEl) timeEl.title = timeEl.textContent;
  if (timeEl) timeEl.textContent = timeEl.textContent + ' (' + N.timeAgo(story.ts) + ')';

  var saveBtn = document.getElementById('saveBtn');
  function paint() { saveBtn.textContent = N.saved.has(story.id) ? '★ सुरक्षित' : '☆ सुरक्षित'; }
  paint();
  saveBtn.onclick = function () {
    var on = N.saved.toggle(story); paint(); N.toast(on ? 'सुरक्षित गरियो' : 'सुरक्षितबाट हटाइयो');
  };
  document.getElementById('copyBtn').onclick = function () { N.copy(N.storyUrl(story)); };

  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.share) {
    var nb = document.createElement('button');
    nb.className = 'sh'; nb.type = 'button'; nb.textContent = '⤴ सेयर';
    nb.onclick = function () { N.share(story); };
    document.querySelector('.share-row span').after(nb);
  }

  N.loadStories().then(function (d) {
    var rel = (d.stories || [])
      .filter(function (s) { return s.c === story.c && s.id !== story.id; })
      .sort(function (a, b) { return b.ts - a.ts; })
      .slice(0, 5);
    if (rel.length < 3) {
      rel = (d.stories || []).filter(function (s) { return s.id !== story.id; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 5);
      document.querySelector('#related .sec-title').textContent = 'ताजा समाचार';
    }
    if (!rel.length) return;
    document.getElementById('relatedList').innerHTML = rel.map(function (s) {
      var th = '<div class="thumb ' + (s.img ? '' : 'noimg') + '" data-ic="' + N.catOf(s.c).icon + '">' +
        (s.img ? '<img loading="lazy" referrerpolicy="no-referrer" src="' + esc(s.img) + '" alt="">' : '') + '</div>';
      return '<article class="row"><a class="row-link" href="/s/' + s.id + '"><h3>' + esc(s.t) + '</h3>' + th + '</a>' +
        '<div class="row-foot"><span class="meta"><span class="src">' + esc(s.src) + '</span><span>·</span><time>' + N.timeAgo(s.ts) + '</time></span></div></article>';
    }).join('');
    document.getElementById('related').hidden = false;
  }).catch(function () {});

  document.addEventListener('error', function (e) {
    var im = e.target;
    if (im && im.tagName === 'IMG' && im.parentElement && im.parentElement.classList.contains('thumb')) {
      im.parentElement.classList.add('noimg'); im.remove();
    }
    if (im && im.tagName === 'IMG' && im.closest('.article-img')) im.closest('.article-img').remove();
  }, true);
})();

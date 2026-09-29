document.documentElement.classList.add('js');
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Segmented toggles: show the children of a panel whose data-show matches the pressed button.
function applyState(panel, value, animate) {
  panel.querySelectorAll('[data-show]').forEach(function (el) {
    var show = el.getAttribute('data-show').split(' ').indexOf(value) !== -1;
    var wasHidden = el.hidden;
    el.hidden = !show;
    if (animate && show && wasHidden && !reduce) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
  });
}
document.querySelectorAll('[data-toggle]').forEach(function (group) {
  var panel = document.getElementById(group.getAttribute('data-toggle'));
  var pressed = group.querySelector('[aria-pressed="true"]');
  if (panel && pressed) applyState(panel, pressed.getAttribute('data-value'), false);
  group.querySelectorAll('button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      if (panel) applyState(panel, btn.getAttribute('data-value'), true);
      group.dataset.touched = '1';
    });
  });
});

// Grid of cells, one per item (used for the rule audit), filled in sequence.
document.querySelectorAll('[data-cells]').forEach(function (el) {
  var total = parseInt(el.getAttribute('data-cells'), 10), html = '';
  for (var i = 0; i < total; i++) html += '<i style="transition-delay:' + Math.round(i * 4) + 'ms"></i>';
  el.innerHTML = html;
});

// Email links are assembled on click, so the address never appears in the page as text.
document.querySelectorAll('.js-mail').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = 'mailto:' + a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
  });
});

// Count-up for headline numbers.
function countUp(el) {
  if (!el || el.dataset.counted) return;
  el.dataset.counted = '1';
  var raw = el.textContent, m = raw.match(/^([^0-9]*)([0-9][0-9,]*)(.*)$/);
  if (!m || reduce) return;
  var target = parseInt(m[2].replace(/,/g, ''), 10), useComma = m[2].indexOf(',') !== -1, start = null;
  function fmt(n) { return useComma ? n.toLocaleString('en-US') : String(n); }
  function step(t) {
    if (!start) start = t;
    var p = Math.min((t - start) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = m[1] + fmt(Math.round(target * e)) + m[3];
    if (p < 1) requestAnimationFrame(step);
  }
  el.textContent = m[1] + fmt(0) + m[3];
  requestAnimationFrame(step);
}

// Autoplay: a toggle that flips on its own while visible, until someone clicks it.
var autoplays = [];
document.querySelectorAll('[data-autoplay]').forEach(function (group) {
  autoplays.push({ group: group, timer: null });
});
function startAuto(a) {
  if (reduce || a.timer) return;
  a.timer = setInterval(function () {
    if (a.group.dataset.touched) return;
    var btns = a.group.querySelectorAll('button'), cur = a.group.querySelector('[aria-pressed="true"]');
    var idx = Array.prototype.indexOf.call(btns, cur), next = btns[(idx + 1) % btns.length];
    btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    next.setAttribute('aria-pressed', 'true');
    applyState(document.getElementById(a.group.getAttribute('data-toggle')), next.getAttribute('data-value'), true);
  }, 2600);
}
function stopAuto(a) { clearInterval(a.timer); a.timer = null; }

// Scroll reveals, with a small stagger between siblings.
var targets = '.section-head, .proof .wrap > div, .pains article, .metrics div, .outcomes > div, .work-card, .more-list li, .build, .stack-grid > div, .numbers li, .block-text, .block-visual, .case-cover, .options li, .reflection, .caps article, .timeline li, .snapshot > div, .facts > div';
var els = document.querySelectorAll(targets);
els.forEach(function (el) {
  el.classList.add('reveal');
  var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(targets); });
  el.style.setProperty('--d', (Math.min(sibs.indexOf(el), 5) * 80) + 'ms');
});
if ('IntersectionObserver' in window && !reduce) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.matches('.numbers li')) countUp(en.target.querySelector('b'));
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      autoplays.forEach(function (a) { if (a.group.closest('.scene') === en.target) { en.isIntersecting ? startAuto(a) : stopAuto(a); } });
    });
  }, { threshold: 0.4 });
  autoplays.forEach(function (a) { io2.observe(a.group.closest('.scene')); });
} else {
  els.forEach(function (el) { el.classList.add('in'); });
}

// Header gets a hairline once the page scrolls.
var hdr = document.querySelector('.site-header');
function onScroll() { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 8); }
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

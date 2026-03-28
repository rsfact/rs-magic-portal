(function () {
  var IS_EXT = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL;
  var MAX_SLOTS = 8;
  var GRADIENTS = [
    ['#799BF9', '#f472b6'], ['#FFA775', '#facc15'], ['#FF5151', '#FFA775'],
    ['#facc15', '#4ade80'], ['#f472b6', '#799BF9'], ['#4ade80', '#799BF9'],
    ['#799BF9', '#FFA775'], ['#FF5151', '#f472b6'],
  ];

  function easeOutQuad(t) { return t * (2 - t); }
  function easeInQuad(t) { return t * t; }

  function extGet(keys, cb) {
    if (IS_EXT && chrome.storage) chrome.storage.local.get(keys, cb);
    else {
      var r = {};
      keys.forEach(function (k) { r[k] = localStorage.getItem(k) || null; });
      cb(r);
    }
  }

  function extSet(obj, cb) {
    if (IS_EXT && chrome.storage) chrome.storage.local.set(obj, cb);
    else {
      Object.keys(obj).forEach(function (k) { localStorage.setItem(k, obj[k]); });
      cb();
    }
  }

  function matchesFilter(f) {
    if (!f || f === '.*' || f === '*') return true;
    try { return new RegExp(f).test(location.href); } catch (e) { return true; }
  }

  function api(base, path, token, body) {
    var h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return fetch(base.replace(/\/+$/, '') + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  function tryLogin(base, email, pw, cb) {
    if (!base || !email || !pw) { cb(null); return; }
    api(base, '/auth/users/login', null, { email: email, password: pw })
      .then(function (d) { cb(d.success && d.data ? d.data.token : null); })
      .catch(function () { cb(null); });
  }

  function fetchApps(base, token, cb) {
    api(base, '/v1/apps/search', token, { page: 1, size: MAX_SLOTS })
      .then(function (d) {
        if (d.success && d.data && d.data.items) {
          cb(d.data.items.map(function (i) {
            return { name: i.name, url: i.url, fa: i.fa_icon, description: i.description };
          }));
        } else { cb([]); }
      })
      .catch(function () { cb([]); });
  }

  function appendToken(url, token) {
    if (!token || !url || url === '#') return url;
    var sep = url.indexOf('#') === -1 ? '#' : '&';
    return url + sep + 'token=' + encodeURIComponent(token);
  }

  function injectDeps() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
      document.head.appendChild(l);
    }
    if (!document.querySelector('link[href*="M+PLUS+Rounded"]')) {
      var f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap';
      document.head.appendChild(f);
    }
  }

  function destroy() {
    document.querySelectorAll('.mgp-ripple,.mgp-wrap,.mgp-modal-bg').forEach(function (el) { el.remove(); });
  }

  function showModal(onSuccess) {
    var bg = document.createElement('div');
    bg.className = 'mgp-modal-bg';
    bg.innerHTML =
      '<div class="mgp-modal"><h3>Magic Portal</h3><p>ログインしてください</p><form>' +
      '<input type="text" id="mgp-m-base" placeholder="API Base URL" autocomplete="off">' +
      '<input type="email" id="mgp-m-email" placeholder="メールアドレス" autocomplete="off">' +
      '<input type="password" id="mgp-m-pw" placeholder="パスワード" autocomplete="off">' +
      '<button type="submit">ログイン</button><div class="mgp-err" id="mgp-m-err"></div></form></div>';
    document.body.appendChild(bg);
    bg.querySelector('#mgp-m-base').focus();
    bg.addEventListener('click', function (e) { if (e.target === bg) bg.remove(); });
    extGet(['mgp_base_url'], function (r) {
      if (r.mgp_base_url) bg.querySelector('#mgp-m-base').value = r.mgp_base_url;
    });
    bg.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var base = bg.querySelector('#mgp-m-base').value.trim();
      var email = bg.querySelector('#mgp-m-email').value.trim();
      var pw = bg.querySelector('#mgp-m-pw').value.trim();
      var err = bg.querySelector('#mgp-m-err');
      if (!base || !email || !pw) { err.textContent = 'すべて入力してください'; err.style.display = 'block'; return; }
      tryLogin(base, email, pw, function (token) {
        if (!token) { err.textContent = '認証に失敗しました'; err.style.display = 'block'; return; }
        extSet({ mgp_token: token, mgp_base_url: base, mgp_email: email }, function () { bg.remove(); onSuccess(); });
      });
    });
  }

  function padSlots(apps) {
    var list = apps.slice(0, MAX_SLOTS);
    while (list.length < MAX_SLOTS) list.push({ _empty: true });
    return list;
  }

  function buildDrawer(apps, token, onLoginClick) {
    var slots = padSlots(apps);
    var ripple = document.createElement('div');
    ripple.className = 'mgp-ripple';
    ripple.innerHTML = '<div></div><div></div><div></div>';
    document.body.appendChild(ripple);
    var wrap = document.createElement('div');
    wrap.className = 'mgp-wrap';
    document.body.appendChild(wrap);

    var els = slots.map(function (app, i) {
      var a = document.createElement('a');
      a.href = app._empty || app._login ? '#' : appendToken(app.url || '#', token);
      a.className = 'mgp-item' + (app._empty ? ' mgp-empty' : '');
      if (!app._login && !app._empty) a.target = '_blank';
      var icon = document.createElement('div');
      icon.className = 'mgp-icon' + (app._empty ? ' mgp-empty-icon' : '');
      if (app._empty) {
        icon.innerHTML = '<div class="mgp-slot"><i></i><i></i><i></i><i></i></div>';
      } else {
        var g = GRADIENTS[i % GRADIENTS.length];
        icon.style.background = 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
        icon.innerHTML = '<i class="' + (app.fa || 'fa-solid fa-cube') + '"></i>';
      }
      a.appendChild(icon);
      if (!app._empty) {
        var tip = document.createElement('span');
        tip.className = 'mgp-tip';
        tip.textContent = app.name || '';
        a.appendChild(tip);
      }
      if (app._login && onLoginClick) a.addEventListener('click', function (e) { e.preventDefault(); onLoginClick(); });
      if (app._empty) a.addEventListener('click', function (e) { e.preventDefault(); });
      wrap.appendChild(a);
      return a;
    });

    var t = 0, raf = null, isOpen = false;

    function calcStyle(el, i) {
      var delay = i * 0.15 / 8;
      var raw = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
      var p = isOpen ? easeOutQuad(raw) : 1 - easeInQuad(1 - raw);
      var inner = i < 3;
      var angle = inner ? (i + 1) * Math.PI / 8 : (i - 2) * Math.PI / 12;
      var rx = window.innerWidth * (inner ? 0.22 : 0.32);
      var ry = window.innerHeight * (inner ? 0.22 : 0.32);
      el.style.transform = 'translate3d(' + (-rx * Math.sin(angle) * p).toFixed(2) + 'px,' + (-ry * Math.cos(angle) * p).toFixed(2) + 'px,0) scale(' + (0.2 + 0.8 * p).toFixed(3) + ') rotate(' + (90 * (1 - p)).toFixed(1) + 'deg)';
      el.style.opacity = Math.min(1, p * 4);
      el.style.pointerEvents = p > 0.6 ? 'auto' : 'none';
    }

    function render() { for (var i = 0; i < els.length; i++) calcStyle(els[i], i); }

    function animate(opening) {
      if (raf) cancelAnimationFrame(raf);
      var startT = t, endT = opening ? 1 : 0, dur = opening ? 400 : 250, t0 = performance.now();
      var step = function (now) {
        var r = Math.min((now - t0) / dur, 1);
        t = startT + (endT - startT) * r;
        render();
        if (r < 1) raf = requestAnimationFrame(step); else raf = null;
      };
      raf = requestAnimationFrame(step);
    }

    render();
    window.addEventListener('mousemove', function (e) {
      var dx = window.innerWidth - e.clientX, dy = window.innerHeight - e.clientY;
      var vw = window.innerWidth, vh = window.innerHeight;
      if (!isOpen && dx < vw * 0.02 && dy < vh * 0.02) { isOpen = true; animate(true); }
      else if (isOpen && (dx > vw * 0.40 || dy > vh * 0.40)) { isOpen = false; animate(false); }
    });
  }

  function startApps(base, token) {
    if (base) {
      fetchApps(base, token, function (apps) { buildDrawer(apps, token); });
    } else {
      buildDrawer([], token);
    }
  }

  function startLogin() {
    buildDrawer([{ name: 'ログイン', fa: 'fa-solid fa-right-to-bracket', url: '#', _login: true }], null, function () {
      showModal(function () {
        destroy();
        extGet(['mgp_token', 'mgp_base_url'], function (r) { startApps(r.mgp_base_url, r.mgp_token); });
      });
    });
  }

  function init() {
    extGet(['mgp_token', 'mgp_base_url', 'mgp_filter', 'mgp_enabled'], function (r) {
      if (r.mgp_enabled === false) return;
      if (!matchesFilter(r.mgp_filter)) return;
      injectDeps();
      if (r.mgp_token) startApps(r.mgp_base_url, r.mgp_token); else startLogin();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

var enabledEl = document.getElementById('enabled');
var baseUrlEl = document.getElementById('baseUrl');
var filterEl = document.getElementById('filter');
var emailEl = document.getElementById('userId');
var passwordEl = document.getElementById('password');
var saveStatusEl = document.getElementById('saveStatus');
var authStatusEl = document.getElementById('authStatus');
var loggedOutEl = document.getElementById('loggedOut');
var loggedInEl = document.getElementById('loggedIn');

var goToWebEl = document.getElementById('goToWeb');
function flash(el, msg, color) {
  el.textContent = msg;
  el.style.color = color;
  el.style.display = 'block';
  setTimeout(function () { el.style.display = 'none'; }, 2000);
}

function authUI(loggedIn) {
  loggedOutEl.className = loggedIn ? 'hidden' : '';
  loggedInEl.className = loggedIn ? '' : 'hidden';
  goToWebEl.classList.toggle('hidden', !loggedIn);
}

chrome.storage.local.get(['mgp_enabled', 'mgp_filter', 'mgp_base_url', 'mgp_token'], function (r) {
  enabledEl.checked = r.mgp_enabled !== false;
  baseUrlEl.value = r.mgp_base_url || '';
  filterEl.value = r.mgp_filter || '.*';
  authUI(!!r.mgp_token);
});

enabledEl.addEventListener('change', function () {
  chrome.storage.local.set({ mgp_enabled: enabledEl.checked });
});

document.getElementById('save').addEventListener('click', function () {
  chrome.storage.local.set({
    mgp_base_url: baseUrlEl.value.trim().replace(/\/+$/, ''),
    mgp_filter: filterEl.value.trim() || '.*'
  }, function () { flash(saveStatusEl, '保存しました', '#799BF9'); });
});

document.getElementById('login').addEventListener('click', function () {
  var base = baseUrlEl.value.trim().replace(/\/+$/, '');
  var email = emailEl.value.trim();
  var pw = passwordEl.value.trim();
  if (!base || !email || !pw) { flash(authStatusEl, 'すべて入力してください', '#FF5151'); return; }
  var paths = ['/api/auth/users/login', '/api/auth/login'];
  var init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email: email, password: pw })
  };
  var loginAttempt = function (i) {
    if (i >= paths.length) return Promise.resolve(null);
    return fetch(base + paths[i], init)
      .then(function (r) {
        if (r.status === 404 || r.status === 405) return loginAttempt(i + 1);
        return r.json().then(function (d) { return d.success && d.data ? d.data.token : null; });
      })
      .catch(function () { return loginAttempt(i + 1); });
  };
  loginAttempt(0)
    .then(function (token) {
      if (!token) { flash(authStatusEl, '認証に失敗しました', '#FF5151'); return; }
      chrome.storage.local.set({ mgp_token: token, mgp_email: email, mgp_base_url: base }, function () {
        emailEl.value = '';
        passwordEl.value = '';
        authUI(true);
        flash(authStatusEl, 'ログイン成功', '#799BF9');
      });
    });
});

document.getElementById('logout').addEventListener('click', function () {
  chrome.storage.local.remove(['mgp_token', 'mgp_email'], function () {
    authUI(false);
    flash(authStatusEl, 'ログアウトしました', '#FF5151');
  });
});

goToWebEl.addEventListener('click', function () {
  var base = baseUrlEl.value.trim().replace(/\/+$/, '');
  if (base) window.open(base + '/ui', '_blank');
});

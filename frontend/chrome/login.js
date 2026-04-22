var baseUrlEl = document.getElementById('baseUrl');
var emailEl = document.getElementById('email');
var passwordEl = document.getElementById('password');
var statusEl = document.getElementById('status');

function showStatus(msg, color) {
  statusEl.textContent = msg;
  statusEl.style.color = color;
}

chrome.storage.local.get(['mgp_base_url', 'mgp_email'], function (r) {
  baseUrlEl.value = r.mgp_base_url || '';
  emailEl.value = r.mgp_email || '';
});

function refreshForHandoff(base, token, cb) {
  var paths = ['/api/auth/refresh', '/api/auth/users/refresh'];
  var tryPath = function (i) {
    if (i >= paths.length) { cb(token); return; }
    fetch(base + paths[i], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ expire_seconds: 30 })
    })
      .then(function (r) {
        if (r.status === 404 || r.status === 405) { tryPath(i + 1); return; }
        return r.json().then(function (d) {
          cb(d && d.success && d.data && d.data.token ? d.data.token : token);
        });
      })
      .catch(function () { tryPath(i + 1); });
  };
  tryPath(0);
}

document.getElementById('save').addEventListener('click', function () {
  var base = baseUrlEl.value.trim().replace(/\/+$/, '');
  var email = emailEl.value.trim();
  var pw = passwordEl.value.trim();

  if (!base) { showStatus('サーバURLを入力してください', '#FF5151'); return; }
  if (!email || !pw) { showStatus('メールアドレスとパスワードを入力してください', '#FF5151'); return; }

  showStatus('ログイン中...', '#94a3b8');

  var paths = ['/api/auth/login', '/api/auth/users/login'];
  var init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email: email, password: pw })
  };

  var attempt = function (i) {
    if (i >= paths.length) return Promise.resolve(null);
    return fetch(base + paths[i], init)
      .then(function (r) {
        if (r.status === 404 || r.status === 405) return attempt(i + 1);
        return r.json().then(function (d) { return d.success && d.data ? d.data.token : null; });
      })
      .catch(function () { return attempt(i + 1); });
  };

  attempt(0).then(function (token) {
    if (!token) { showStatus('認証に失敗しました', '#FF5151'); return; }
    chrome.storage.local.set({
      mgp_base_url: base,
      mgp_email: email,
      mgp_token: token
    }, function () {
      refreshForHandoff(base, token, function (shortToken) {
        window.location.href = base + '/ui#token=' + encodeURIComponent(shortToken);
      });
    });
  });
});

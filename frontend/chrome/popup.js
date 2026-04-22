var enabledEl = document.getElementById('enabled');
var filterEl = document.getElementById('filter');
var goToWebEl = document.getElementById('goToWeb');
var logoutEl = document.getElementById('logout');
var statusEl = document.getElementById('status');

function flash(msg, color) {
  statusEl.textContent = msg;
  statusEl.style.color = color;
  statusEl.style.display = 'block';
  setTimeout(function () { statusEl.style.display = 'none'; }, 2000);
}

var goToLoginEl = document.getElementById('goToLogin');
var authDividerEl = document.getElementById('authDivider');

function updateAuthUI(loggedIn) {
  goToWebEl.classList.toggle('hidden', !loggedIn);
  authDividerEl.classList.toggle('hidden', !loggedIn);
  logoutEl.classList.toggle('hidden', !loggedIn);
  goToLoginEl.classList.toggle('hidden', loggedIn);
}

chrome.storage.local.get(['mgp_enabled', 'mgp_filter', 'mgp_token'], function (r) {
  enabledEl.checked = r.mgp_enabled !== false;
  filterEl.value = r.mgp_filter || '.*';
  updateAuthUI(!!r.mgp_token);
});

enabledEl.addEventListener('change', function () {
  chrome.storage.local.set({ mgp_enabled: enabledEl.checked });
});

filterEl.addEventListener('change', function () {
  chrome.storage.local.set({ mgp_filter: filterEl.value.trim() || '.*' });
});

function refreshForHandoff(base, token, cb) {
  fetch(base + '/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ expire_seconds: 30 })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) { cb(d && d.success && d.data && d.data.token ? d.data.token : token); })
    .catch(function () { cb(token); });
}

goToWebEl.addEventListener('click', function () {
  chrome.storage.local.get(['mgp_base_url', 'mgp_token'], function (r) {
    var base = (r.mgp_base_url || '').replace(/\/+$/, '');
    if (!base || !r.mgp_token) return;
    refreshForHandoff(base, r.mgp_token, function (shortToken) {
      window.open(base + '/ui#token=' + encodeURIComponent(shortToken), '_blank');
    });
  });
});

logoutEl.addEventListener('click', function () {
  chrome.storage.local.remove(['mgp_token', 'mgp_email'], function () {
    updateAuthUI(false);
    flash('ログアウトしました', '#FF5151');
  });
});

document.getElementById('goToLogin').addEventListener('click', function () {
  chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
});

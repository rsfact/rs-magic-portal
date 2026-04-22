chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.action === 'openSettings') {
    chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
  }
});

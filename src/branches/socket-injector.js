const s = document.createElement('script');
s.src = chrome.runtime.getURL('src/branches/socket.js');
(document.head || document.documentElement).appendChild(s);
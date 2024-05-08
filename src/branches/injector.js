var s1 = document.createElement('script');
s1.src = chrome.runtime.getURL('src/branches/injected/socket.js');
(document.head || document.documentElement).appendChild(s1);

var s2 = document.createElement('script');
s2.src = chrome.runtime.getURL('src/branches/injected/xhr.js');
(document.head || document.documentElement).appendChild(s2);
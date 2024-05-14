// var s1 = document.createElement('script');
// s1.src = chrome.runtime.getURL('src/branches/injected/socket.js');
// (document.head || document.documentElement).appendChild(s1);

// var s2 = document.createElement('script');
// s2.src = chrome.runtime.getURL('src/branches/injected/xhr.js');
// (document.head || document.documentElement).appendChild(s2);

var ds
for (const script of [/*'src/lib/wsHook.js',*//*'src/lib/xhook.min.js',*/'src/branches/injected/socket.js', 'src/branches/injected/xhr.js']) {
    ds = document.createElement('script');
    ds.src = chrome.runtime.getURL(script);
    (document.head || document.documentElement).appendChild(ds);
}
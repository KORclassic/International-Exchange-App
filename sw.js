// 오프라인에서도 일정·안내가 열리도록 앱 파일을 저장해 둡니다.
const CACHE = 'hiroshima-v5';
const LIBS = ['app', 'auth', 'database'].map(n => `https://www.gstatic.com/firebasejs/11.6.1/firebase-${n}.js`);
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => c.addAll(LIBS).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 앱 파일: 최신 것을 먼저 받고, 인터넷이 없으면 저장본 사용
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else if (url.hostname === 'www.gstatic.com') {
    // Firebase 라이브러리: 저장본 우선
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});

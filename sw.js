// 씨앤에이케어 재무관리 — 서비스워커
// 원칙: 항상 네트워크 우선. 오프라인일 때만 마지막으로 받은 화면을 보여줌.
// (데이터는 Firestore에서 실시간으로 받으므로 캐시하지 않음 / version.txt는 절대 캐시하지 않음)
const CACHE = 'cna-finance-shell-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // Firebase·폰트·CDN 등 외부 요청은 건드리지 않음
  if (url.pathname.endsWith('version.txt')) return;         // 새 버전 감지는 항상 서버 원본
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? 'index.html' : req, copy));
      }
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreSearch: true }))
  );
});

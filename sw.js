// ═══════════════════════════════════════════════════════════
// AcademyPay 서비스워커 (PWA)
//   ★ 핵심: HTML(index.html)은 "네트워크 우선"으로 가져온다.
//     예전 캐시-우선 방식은 새 파일을 올려도 옛 화면이 계속 떠서
//     "수정이 반영 안 된다"는 문제를 일으켰다. 이제 온라인이면 항상 최신본.
//   버전을 올릴 때마다 아래 VERSION 문자열만 바꾸면 옛 캐시가 정리된다.
// ═══════════════════════════════════════════════════════════
const VERSION = 'academypay-2026-08-06a';

// 설치 즉시 대기 상태를 건너뛰고 새 버전을 활성화 준비
self.addEventListener('install', () => {
  self.skipWaiting();
});

// index.html의 등록 스크립트가 보내는 메시지로도 즉시 활성화
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// 활성화되면 옛 버전 캐시를 지우고 즉시 페이지 제어권을 가져온다
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  const sameOrigin = url.origin === self.location.origin;
  const isHTML = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html');

  // 1) HTML/네비게이션 → 네트워크 우선 (항상 최신 화면). 오프라인이면 캐시로 대체.
  if (sameOrigin && isHTML) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || await caches.match('./index.html') || Response.error();
      }
    })());
    return;
  }

  // 2) 그 외 정적 자원(아이콘 등) → 캐시 우선 + 백그라운드 갱신(stale-while-revalidate)
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.status === 200 && sameOrigin) {
        caches.open(VERSION).then(c => c.put(req, res.clone()));
      }
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});

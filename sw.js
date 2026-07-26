const CACHE_NAME = 'academypay-v1';
// 네트워크 우선 전략 — 항상 최신 데이터 사용
// 오프라인 시에만 캐시 사용

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Supabase API는 캐시 안 함
  if(e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공 시 캐시에 저장
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 응답
        return caches.match(e.request);
      })
  );
});

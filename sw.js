// ═══════════════════════════════════════════════════════════
// AcademyPay 서비스워커 — 제거(킬스위치)
//
//   목적: 예전 "캐시 우선" 서비스워커가 새 index.html을 올려도
//   옛 버전을 계속 캐시에서 꺼내 보여주던 문제를 영구히 끝낸다.
//
//   이 파일은 스스로 모든 캐시를 지우고, 자기 자신을 등록 해제한다.
//   이후에는 서비스워커 없이 동작하므로, 업로드 후 새로고침(Ctrl+F5)만으로
//   항상 최신 화면이 뜬다.
//
//   ※ 학원 데이터는 Supabase 서버에 저장된다. 이 파일은 브라우저의
//     "정적 파일 캐시"만 지우며, 학원 데이터에는 전혀 접근하지 않는다.
// ═══════════════════════════════════════════════════════════

self.addEventListener('install', () => {
  // 대기 없이 즉시 활성화 단계로
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1) 모든 캐시 삭제
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* 무시 */ }
    // 2) 이 서비스워커 자신을 등록 해제
    try { await self.registration.unregister(); } catch (_) { /* 무시 */ }
    // (자동 새로고침은 하지 않는다 — 새로고침 루프를 피하기 위해.
    //  사용자가 Ctrl+F5 한 번 더 하면 서비스워커 없이 최신본이 뜬다.)
  })());
});

// 아직 살아있는 동안의 요청은 무조건 네트워크로 (캐시 사용 안 함)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => new Response('', { status: 504 }))
  );
});

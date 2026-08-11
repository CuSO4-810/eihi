// 忧蓝回忆0.9.5 — Service Worker
// 策略：安装时全量预缓存，之后永远从缓存读取（无更新逻辑）

var CACHE_NAME = "ylhy-0.9.5-v4";
var FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/game.css",
  "/game.js",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  // 背景
  "/assets/教室.png",
  "/assets/走廊.png",
  "/assets/天台.png",
  "/assets/校门.png",
  "/assets/黄昏.png",
  "/assets/泰山.png",
  // 角色立绘
  "/assets/yan_normal.png",
  "/assets/yan_smile.png",
  "/assets/beauty_normal.png",
  "/assets/beauty_blush.png",
  "/assets/fun_normal.png",
  "/assets/fun_laugh.png",
  "/assets/fourteen_normal.png",
  "/assets/fourteen_smile.png",
  "/assets/fourteen_outdoor.png",
  "/assets/gos_normal.png",
  "/assets/gos_smile.png",
  "/assets/gos_fursuit.png",
  // BGM
  "/assets/bgm/classroom.mp3",
  "/assets/bgm/hallway.mp3",
  "/assets/bgm/rooftop.mp3",
  "/assets/bgm/farewell.mp3",
  // SFX
  "/assets/sfx/click.mp3",
  // Voice
  "/assets/voice/intro_yan_01.mp3",
  "/assets/voice/intro_yan_02.mp3",
  "/assets/voice/intro_beauty_01.mp3",
  "/assets/voice/intro_beauty_02.mp3",
  "/assets/voice/yan03.mp3",
  "/assets/voice/yan04.mp3",
  "/assets/voice/yan05.mp3",
  "/assets/voice/yan06.mp3",
  "/assets/voice/yan07.mp3",
  "/assets/voice/yan08.mp3",
  "/assets/voice/yan09.mp3",
  "/assets/voice/yan10.mp3",
  "/assets/voice/yan11.mp3",
  "/assets/voice/yan12.mp3",
  "/assets/voice/yan13.mp3",
  "/assets/voice/yan14.mp3",
  "/assets/voice/yan15.mp3"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("[SW] Caching all files...");
      return cache.addAll(FILES_TO_CACHE);
    }).then(function() {
      console.log("[SW] All files cached, skipping waiting");
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});

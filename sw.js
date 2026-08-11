// 忧蓝回忆0.9.5 — Service Worker
// 策略：安装时全量预缓存，之后永远从缓存读取（无更新逻辑）

var CACHE_NAME = "ylhy-0.9.5";
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
  "/assets/bgm/classroom.wav",
  "/assets/bgm/hallway.wav",
  "/assets/bgm/rooftop.wav",
  "/assets/bgm/farewell.wav",
  // SFX
  "/assets/sfx/click.wav",
  // Voice
  "/assets/voice/intro_yan_01.wav",
  "/assets/voice/intro_yan_02.wav",
  "/assets/voice/intro_beauty_01.wav",
  "/assets/voice/intro_beauty_02.wav",
  "/assets/voice/yan03.wav",
  "/assets/voice/yan04.wav",
  "/assets/voice/yan05.wav",
  "/assets/voice/yan06.wav",
  "/assets/voice/yan07.wav",
  "/assets/voice/yan08.wav",
  "/assets/voice/yan09.wav",
  "/assets/voice/yan10.wav",
  "/assets/voice/yan11.wav",
  "/assets/voice/yan12.wav",
  "/assets/voice/yan13.wav",
  "/assets/voice/yan14.wav",
  "/assets/voice/yan15.wav"
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

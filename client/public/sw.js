self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("n-dizi-cache").then((cache) => {
      return cache.addAll(["/", "/index.html", "/mono.png"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

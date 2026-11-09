/* SOMDEJ License — sw.js : ติดตั้งเป็นแอปได้ + เปิดหน้าได้เร็ว · ไม่แตะคำขอไป Apps Script · ลองเน็ตก่อน เน็ตล่มใช้สำเนาในเครื่อง */
var CACHE = 'slic-2569-11-09.1';
var CORE = ['./', 'index.html', 'style.css', 'app.js', 'pages-me.js', 'pages-dash.js', 'pages-admin.js', 'pages-mail.js', 'pages-settings.js', 'xlsx-io.js', 'help.js', 'config.js', 'icon-192.png', 'logo.jpg', 'manifest.webmanifest'];
self.addEventListener('install', function (e) { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE).catch(function () { }); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('slic-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || /version\.json/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r, { ignoreSearch: /\.(html)$|\/$/.test(u.pathname) }).then(function (m) { return m || caches.match('index.html'); }); }));
});

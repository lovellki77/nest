// ============================================================
// 梦语 PWA - Service Worker
// ============================================================

var CACHE_VERSION = 'v1';
var CACHE_NAME = 'mengyu-' + CACHE_VERSION;

// 需要缓存的静态资源（根据实际文件调整）
var STATIC_ASSETS = [
  '/nest/',
  '/nest/index.html',
  '/nest/site.webmanifest',
  '/nest/favicon-96x96.png',
  '/nest/favicon.svg',
  '/nest/favicon.ico',
  '/nest/apple-touch-icon.png',
  '/nest/icons/icon-192.png',
  '/nest/icons/icon-512.png'
];

// ============================================================
// 安装事件 - 预缓存资源
// ============================================================
self.addEventListener('install', function(event) {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] 开始缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        console.log('[SW] 缓存完成');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('[SW] 缓存失败:', error);
        return self.skipWaiting();
      })
  );
});

// ============================================================
// 激活事件 - 清理旧缓存
// ============================================================
self.addEventListener('activate', function(event) {
  console.log('[SW] 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name !== CACHE_NAME && name.startsWith('mengyu-');
            })
            .map(function(name) {
              console.log('[SW] 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] 激活完成');
        return self.clients.claim();
      })
  );
});

// ============================================================
// 请求拦截 - 缓存优先策略
// ============================================================
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);
  
  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(function(cachedResponse) {
        // 有缓存则返回缓存
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 无缓存则从网络获取
        return fetch(request)
          .then(function(response) {
            // 只缓存成功的响应
            if (response && response.status === 200) {
              var cloned = response.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(request, cloned);
                })
                .catch(function() {});
            }
            return response;
          })
          .catch(function() {
            // 完全离线时返回一个简单的提示
            return new Response('离线状态，请连接网络后重试', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

console.log('[SW] 梦语 Service Worker 已加载');

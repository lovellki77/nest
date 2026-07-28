// ============================================================
// Service Worker 卸载脚本
// 作用：清除所有缓存，然后让 SW 自我销毁，不再拦截请求
// ============================================================

// 安装时立即激活，不等旧的 SW
self.addEventListener('install', function(e) {
    console.log('[卸载SW] 安装中，立即激活');
    self.skipWaiting();
});

// 激活时清除所有缓存，然后释放控制权
self.addEventListener('activate', function(e) {
    console.log('[卸载SW] 激活中，清除所有缓存...');
    e.waitUntil(
        caches.keys().then(function(cacheNames) {
            console.log('[卸载SW] 找到缓存:', cacheNames);
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    console.log('[卸载SW] 删除缓存:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            console.log('[卸载SW] 所有缓存已清除，开始接管页面');
            return self.clients.claim();
        })
    );
});

// 不拦截任何请求，直接放行（相当于 SW 不存在）
self.addEventListener('fetch', function(e) {
    // 直接去服务器请求，不读缓存
    e.respondWith(fetch(e.request));
});

console.log('[卸载SW] Service Worker 已进入卸载模式');
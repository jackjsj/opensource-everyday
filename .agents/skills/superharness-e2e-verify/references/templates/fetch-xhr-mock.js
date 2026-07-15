// Cross-Domain Mock Injection (fetch + XHR override)
// Usage: Replace {MOCK_MAP_AS_JSON} with your mock map, then pass to `agent-browser eval "..."`
// Pattern key: API name only (e.g. "mtop.btrip.common.greycheck"), matching via url.includes(pattern)
// Timing: Install AFTER open + wait --load networkidle, BEFORE the triggering action
(function() {
  const mocks = {MOCK_MAP_AS_JSON};
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = ((init && init.method) || 'GET').toUpperCase();
    for (const [pattern, mock] of Object.entries(mocks)) {
      if (url.includes(pattern) && method === mock.method) {
        return Promise.resolve(new Response(JSON.stringify(mock.body), {
          status: mock.status,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    }
    return originalFetch.apply(this, arguments);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__sh_method = (method || 'GET').toUpperCase();
    this.__sh_url = url || '';
    return originalOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    for (const [pattern, mock] of Object.entries(mocks)) {
      if (this.__sh_url && this.__sh_url.includes(pattern) && this.__sh_method === mock.method) {
        Object.defineProperty(this, 'readyState', { get: () => 4 });
        Object.defineProperty(this, 'status', { get: () => mock.status });
        Object.defineProperty(this, 'responseText', { get: () => JSON.stringify(mock.body) });
        Object.defineProperty(this, 'response', { get: () => JSON.stringify(mock.body) });
        setTimeout(() => {
          if (this.onreadystatechange) this.onreadystatechange();
          if (this.onload) this.onload();
          this.dispatchEvent(new Event('load'));
        }, 0);
        return;
      }
    }
    return originalSend.apply(this, arguments);
  };
  window.__sh_mock_active = true;
})();

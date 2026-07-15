// <script> tag interception fallback
// Use when lib.mtop is bundled in webpack closure and not accessible on window
// Intercepts document.createElement('script') and matches src URL against mock patterns
// Timing: Install AFTER open + wait --load networkidle, BEFORE the triggering action
(function() {
  const mocks = {MOCK_MAP_AS_JSON};
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    const el = originalCreateElement(tag);
    if (tag.toLowerCase() === 'script') {
      const originalSrcSet = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      if (originalSrcSet && originalSrcSet.set) {
        Object.defineProperty(el, 'src', {
          set: function(url) {
            const urlStr = String(url);
            for (const [pattern, mock] of Object.entries(mocks)) {
              if (urlStr.includes(pattern)) {
                const body = typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body);
                const parsed = JSON.parse(body);
                const cbMatch = urlStr.match(/callback=([^&]+)/);
                const cbName = cbMatch ? cbMatch[1] : null;
                setTimeout(() => {
                  if (cbName && window[cbName]) {
                    window[cbName]({
                      ret: mock.status === 200 ? ['SUCCESS::\u8c03\u7528\u6210\u529f'] : ['FAIL::' + (parsed.message || 'mock error')],
                      data: parsed.data || parsed
                    });
                  }
                }, 50);
                return;
              }
            }
            originalSrcSet.set.call(el, url);
          },
          get: originalSrcSet ? originalSrcSet.get : undefined
        });
      }
    }
    return el;
  };
  window.__sh_script_mock_active = true;
})();

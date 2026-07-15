// mtop JSONP / lib.mtop SDK Mock Injection
// Usage: Replace {MOCK_MAP_AS_JSON} with mock map keyed by mtop API name
// Response shape: { ret: [...], data: {...} } — mtop SDK format, not raw HTTP
// Timing: Install AFTER open + wait --load networkidle, BEFORE the triggering action
(function() {
  const mocks = {MOCK_MAP_AS_JSON};
  if (!window.lib || !window.lib.mtop) {
    console.error('[sh-mock] lib.mtop not found on window');
    return;
  }
  const originalRequest = window.lib.mtop.request;
  window.lib.mtop.request = function(config) {
    const apiName = config && config.api ? config.api : '';
    for (const [pattern, mock] of Object.entries(mocks)) {
      if (apiName.includes(pattern)) {
        const body = typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body);
        const parsed = JSON.parse(body);
        const mtopResponse = {
          ret: mock.status === 200 ? ['SUCCESS::\u8c03\u7528\u6210\u529f'] : ['FAIL::' + (parsed.message || 'mock error')],
          data: parsed.data || parsed,
          api: apiName,
          v: config.v || '1.0'
        };
        return Promise.resolve(mtopResponse);
      }
    }
    return originalRequest.apply(this, arguments);
  };
  window.__sh_mtop_mock_active = true;
})();

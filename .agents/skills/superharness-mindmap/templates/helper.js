// WebSocket client: receives Markdown data → renders with Markmap (no page reload).
(() => {
	let ws;
	const statusEl = document.getElementById("status");
	const container = document.getElementById("mindmap-container");
	let mm = null; // Markmap instance
	let svgEl = null;

	function initSvg() {
		container.innerHTML = "";
		svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgEl.style.width = "100%";
		svgEl.style.height = "100%";
		container.appendChild(svgEl);
	}

	function renderMarkmap(markdown) {
		if (!svgEl) initSvg();

		const transformer = new markmap.Transformer();
		const result = transformer.transform(markdown);
		const root = result.root;

		if (!mm) {
			mm = markmap.Markmap.create(
				svgEl,
				{
					autoFit: true,
					duration: 300,
				},
				root,
			);
		} else {
			mm.setData(root);
			mm.fit();
		}
	}

	function connect() {
		ws = new WebSocket(`ws://${window.location.host}`);
		ws.onopen = () => {
			if (statusEl) statusEl.textContent = "connected";
		};
		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.type === "update" && msg.markdown) {
					renderMarkmap(msg.markdown);
					if (statusEl) statusEl.textContent = "updated";
				}
			} catch (e) {
				console.error("render error:", e);
			}
		};
		ws.onclose = () => {
			if (statusEl) statusEl.textContent = "reconnecting...";
			setTimeout(connect, 1000);
		};
		ws.onerror = () => {
			ws.close();
		};
	}

	connect();
})();

## agent-browser Command Reference

Read this when you need the full command list or details about a specific agent-browser command.

---

| Command | Purpose | Notes |
|---------|---------|-------|
| `agent-browser open <url>` | Navigate to URL | Use `--headed` for non-headless |
| `agent-browser snapshot -i` | Accessibility tree with interactive refs | Refs (@eN) are stale after page changes |
| `agent-browser click @eN` | Click element | |
| `agent-browser fill @eN "text"` | Clear and fill input | Empty string may not trigger React onChange — see [mock-inject.md](mock-inject.md) |
| `agent-browser eval "<js>"` | Execute JS in page context | Fallback for fill/react, mock injection, probes |
| `agent-browser press Enter` | Press key | |
| `agent-browser select @eN "value"` | Select dropdown option | |
| `agent-browser hover @eN` | Hover element | |
| `agent-browser wait --load networkidle` | Wait for network idle | |
| `agent-browser wait --text "..."` | Wait for text to appear | |
| `agent-browser wait --url "..."` | Wait for URL change | |
| `agent-browser get url` | Get current URL | |
| `agent-browser get text` | Get page text | |
| `agent-browser errors --json` | Console errors as JSON | Use `--json` for evidence files |
| `agent-browser screenshot [path]` | Take screenshot | May save to temp dir — always verify file exists (see §6.3 fallback) |
| `agent-browser network requests --status 400-599 --json` | Failed network requests | |
| `agent-browser network route <url> --body <json>` | Intercept & mock response | Same-origin only, no `--status` flag — see §6.2 Step 2b for cross-domain eval fallback |
| `agent-browser network unroute` | Remove all intercepts | |
| `agent-browser state save <path>` | Save cookies + localStorage | |
| `agent-browser state load <path>` | Load cookies + localStorage | |
| `agent-browser set viewport <w> <h>` | Set viewport dimensions | |
| `agent-browser set device "<name>"` | Emulate device (implies viewport + UA) | |
| `agent-browser set media dark\|light` | Set color scheme preference | |
| `agent-browser close` | Close browser | |

**Rules:**
- After any page change (navigation, form submission), re-run `snapshot -i` for fresh refs
- Refs (@eN) are stale after page changes
- Use `wait` to ensure stability before snapshot
- Always use `--json` flag when capturing evidence for files

const tg = window.Telegram?.WebApp;

function initData() {
  if (tg && tg.initData) return tg.initData;
  // dev fallback — server will reject
  return "";
}

async function call(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": initData(),
    ...(opts.headers || {}),
  };
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail; } catch (_) { /* noop */ }
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => call("/api/me"),
  spin: (bet) => call("/api/roulette/spin", { method: "POST", body: JSON.stringify({ bet }) }),
  inventory: () => call("/api/inventory"),
  shop: () => call("/api/shop"),
  buy: (key) => call("/api/shop/buy", { method: "POST", body: JSON.stringify({ key }) }),
  tasks: () => call("/api/tasks"),
  claimTask: (key) => call("/api/tasks/claim", { method: "POST", body: JSON.stringify({ key }) }),
  history: () => call("/api/history"),
  referral: () => call("/api/referral"),
};

export { tg };

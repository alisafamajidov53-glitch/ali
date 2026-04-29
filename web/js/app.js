import { api, tg } from "./api.js";
import { closeModal, toast } from "./ui.js";
import { renderHome } from "./screens/home.js";
import { renderRoulette } from "./screens/roulette.js";
import { renderTasks } from "./screens/tasks.js";
import { renderShop } from "./screens/shop.js";
import { renderHistory } from "./screens/history.js";
import { showInventoryModal } from "./screens/inventory.js";
import { showReferralModal } from "./screens/referral.js";

const ctx = { user: null, screen: "roulette" };

const renderers = {
  home: renderHome,
  tasks: renderTasks,
  roulette: renderRoulette,
  shop: renderShop,
  history: renderHistory,
};

function refreshHeader() {
  const lvl = document.getElementById("level-num");
  if (lvl && ctx.user) lvl.textContent = String(ctx.user.level);
  const u = document.getElementById("bot-username");
  if (u && ctx.user && ctx.user.bot_username) u.textContent = ctx.user.bot_username;
}

ctx.refreshHeader = refreshHeader;
ctx.go = go;

function go(screen) {
  ctx.screen = screen;
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.screen === screen);
  });
  const root = document.getElementById("screen-root");
  const fn = renderers[screen] || renderRoulette;
  fn(root, ctx);
}

async function boot() {
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (_) { /* noop */ }
    if (tg.themeParams && tg.themeParams.bg_color) {
      // keep our brand bg, ignore tg theme
    }
  }
  try {
    ctx.user = await api.me();
  } catch (e) {
    toast(`Ошибка авторизации: ${e.message}`, "err");
    ctx.user = {
      tg_id: 0,
      username: null,
      first_name: "Гость",
      balance: 0,
      stars: 0,
      level: 1,
      total_spins: 0,
      referral_count: 0,
    };
  }
  refreshHeader();

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => go(b.dataset.screen));
  });
  document.getElementById("inventory-shortcut").addEventListener("click", showInventoryModal);
  document.getElementById("referral-pill").addEventListener("click", showReferralModal);
  document.getElementById("close-btn").addEventListener("click", () => {
    if (tg && tg.close) tg.close();
  });
  document.getElementById("back-btn").addEventListener("click", () => {
    if (ctx.screen !== "roulette") go("roulette");
    else if (tg && tg.close) tg.close();
  });
  document.getElementById("menu-btn").addEventListener("click", () => {
    closeModal();
    showReferralModal();
  });

  go("roulette");
}

boot();

import { api } from "../api.js";
import { el, toast } from "../ui.js";

const REEL_SYMBOLS = ["🐶", "💖", "🦌", "🧸", "🎁", "🎂", "🪙", "⭐"];

let currentBet = "1x";
let isSpinning = false;

function buildReel(track, finalEmoji) {
  // Fill reel with random symbols, ensure final cell shows the prize emoji.
  track.innerHTML = "";
  const cellCount = 32;
  for (let i = 0; i < cellCount; i++) {
    const sym = i === cellCount - 4 ? finalEmoji : REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)];
    track.appendChild(el("div", { class: "reel-cell" }, [sym]));
  }
  return cellCount - 4;
}

function prizeEmoji(prize) {
  if (prize.type === "coins") return prize.amount > 0 ? "🪙" : "❌";
  if (prize.type === "stars") return "⭐";
  return prize.emoji || "🎁";
}

function prizeLabel(prize) {
  if (prize.type === "coins") return prize.amount > 0 ? `+${prize.amount} монет` : "Не повезло";
  if (prize.type === "stars") return `+${prize.amount} ⭐`;
  return `${prize.emoji || ""} ${prize.name || prize.key}`.trim();
}

export async function renderRoulette(root, ctx) {
  isSpinning = false;
  root.innerHTML = "";

  const stage = el("div", { class: "reel-stage" });
  const track = el("div", { class: "reel-track" });
  const marker = el("div", { class: "reel-marker" });
  buildReel(track, "🐶");
  stage.appendChild(track);
  stage.appendChild(marker);

  const invStrip = el("div", { class: "inv-strip" }, [
    el("div", { class: "inv-cell" }, ["🎂"]),
    el("div", { class: "inv-cell" }, ["🧸"]),
    el("div", { class: "inv-cell" }, ["🎁"]),
  ]);

  const tabs = el("div", { class: "bet-tabs" });
  for (const bet of ["1x", "10x", "100x"]) {
    const t = el(
      "button",
      {
        class: `bet-tab ${bet === currentBet ? "active" : ""}`,
        onclick: () => {
          if (isSpinning) return;
          currentBet = bet;
          tabs.querySelectorAll(".bet-tab").forEach((x) => x.classList.remove("active"));
          t.classList.add("active");
        },
      },
      [bet === "1x" ? "1X ШАНС" : bet.toUpperCase()],
    );
    tabs.appendChild(t);
  }

  const spinBtn = el(
    "button",
    {
      class: "spin-btn",
      onclick: doSpin,
    },
    [el("div", { class: "spin-ring" })],
  );

  const balanceRow = el("div", { class: "balance-row" }, [
    el("div", { class: "b-cell" }, ["🪙 ", el("span", { id: "bal-coins" }, [String(ctx.user.balance)])]),
    el("div", { class: "b-cell" }, ["⭐ ", el("span", { id: "bal-stars" }, [String(ctx.user.stars)])]),
  ]);

  root.appendChild(el("div", { class: "roulette" }, [stage, invStrip, balanceRow, tabs, spinBtn]));

  async function doSpin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.classList.add("loading");
    spinBtn.disabled = true;
    tabs.querySelectorAll(".bet-tab").forEach((x) => (x.disabled = true));
    try {
      const res = await api.spin(currentBet);
      const targetIdx = buildReel(track, prizeEmoji(res.prize));
      // reset position
      track.style.transition = "none";
      track.style.transform = `translateX(0)`;
      // force reflow
      void track.offsetWidth;
      const cellW = 140 + 18;
      const stageW = stage.clientWidth;
      const finalShift = targetIdx * cellW - (stageW / 2 - cellW / 2);
      track.style.transition = "transform 4s cubic-bezier(.05,.7,.15,1)";
      track.style.transform = `translateX(-${finalShift}px)`;

      setTimeout(() => {
        toast(prizeLabel(res.prize), res.prize.type === "coins" && res.prize.amount === 0 ? "info" : "win");
        ctx.user.balance = res.new_balance;
        ctx.user.stars = res.new_stars;
        const c = document.getElementById("bal-coins");
        const s = document.getElementById("bal-stars");
        if (c) c.textContent = String(res.new_balance);
        if (s) s.textContent = String(res.new_stars);
        ctx.refreshHeader && ctx.refreshHeader();
        spinBtn.classList.remove("loading");
        spinBtn.disabled = false;
        tabs.querySelectorAll(".bet-tab").forEach((x) => (x.disabled = false));
        isSpinning = false;
      }, 4100);
    } catch (e) {
      toast(e.message || "Ошибка", "err");
      spinBtn.classList.remove("loading");
      spinBtn.disabled = false;
      tabs.querySelectorAll(".bet-tab").forEach((x) => (x.disabled = false));
      isSpinning = false;
    }
  }
}

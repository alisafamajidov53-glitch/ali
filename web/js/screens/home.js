import { el } from "../ui.js";

export function renderHome(root, ctx) {
  root.innerHTML = "";
  const u = ctx.user;
  const greet = u.first_name ? `Привет, ${u.first_name}!` : "Привет!";
  const card = el("div", { class: "hero" }, [
    el("div", { class: "greeting" }, [greet]),
    el("div", { class: "username" }, [u.username ? `@${u.username}` : ""]),
    el("div", { class: "stats" }, [
      el("div", { class: "stat" }, [
        el("div", { class: "v" }, [String(u.balance)]),
        el("div", { class: "l" }, ["🪙 Баланс"]),
      ]),
      el("div", { class: "stat" }, [
        el("div", { class: "v" }, [String(u.stars)]),
        el("div", { class: "l" }, ["⭐ Звёзды"]),
      ]),
      el("div", { class: "stat" }, [
        el("div", { class: "v" }, [String(u.total_spins)]),
        el("div", { class: "l" }, ["🎰 Спины"]),
      ]),
      el("div", { class: "stat" }, [
        el("div", { class: "v" }, [String(u.referral_count)]),
        el("div", { class: "l" }, ["👥 Рефералы"]),
      ]),
    ]),
    el(
      "button",
      { class: "play-btn", onclick: () => ctx.go("roulette") },
      ["Играть в рулетку 🎰"],
    ),
  ]);
  root.appendChild(el("div", { class: "screen-title" }, ["Главная"]));
  root.appendChild(card);
}

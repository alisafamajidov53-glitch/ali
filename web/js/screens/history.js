import { api } from "../api.js";
import { el } from "../ui.js";

const TYPE_LABEL = {
  spin_win: "🎰 Спин",
  spin_loss: "🎰 Спин",
  shop_buy: "🛍 Покупка",
  task_claim: "✅ Задание",
  referral: "👥 Реферал",
  daily_bonus: "🎁 Бонус",
};

export async function renderHistory(root) {
  root.innerHTML = "";
  root.appendChild(el("div", { class: "screen-title" }, ["История"]));
  const list = el("div", { class: "list" });
  root.appendChild(list);
  try {
    const rows = await api.history();
    if (!rows.length) {
      list.appendChild(el("div", { class: "empty" }, ["Пока пусто. Сыграй в рулетку!"]));
      return;
    }
    for (const r of rows) {
      const sign = r.amount > 0 ? "+" : "";
      const date = new Date(r.created_at).toLocaleString("ru-RU");
      list.appendChild(
        el("div", { class: "list-item" }, [
          el("div", { class: "ic" }, [r.item_key ? "🎁" : "🪙"]),
          el("div", { class: "body" }, [
            el("div", { class: "t1" }, [TYPE_LABEL[r.type] || r.type]),
            el("div", { class: "t2" }, [date]),
            r.details ? el("div", { class: "t2" }, [r.details]) : null,
          ]),
          el("div", { class: "t3" }, [`${sign}${r.amount}`]),
        ]),
      );
    }
  } catch (e) {
    list.appendChild(el("div", { class: "empty" }, [e.message || "Ошибка"]));
  }
}

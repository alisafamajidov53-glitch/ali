import { api } from "../api.js";
import { el, toast } from "../ui.js";

export async function renderShop(root, ctx) {
  root.innerHTML = "";
  root.appendChild(el("div", { class: "screen-title" }, ["Магазин"]));
  const list = el("div", { class: "list" });
  root.appendChild(list);
  try {
    const items = await api.shop();
    if (!items.length) {
      list.appendChild(el("div", { class: "empty" }, ["Магазин пуст"]));
      return;
    }
    for (const it of items) {
      const btn = el(
        "button",
        {
          class: "btn",
          onclick: async () => {
            try {
              const res = await api.buy(it.key);
              toast(`Куплено: ${it.name}`, "win");
              ctx.user.balance = res.new_balance;
              ctx.user.stars = res.new_stars;
              ctx.refreshHeader && ctx.refreshHeader();
            } catch (e) {
              toast(e.message || "Ошибка", "err");
            }
          },
        },
        [`${it.price} ${it.currency === "stars" ? "⭐" : "🪙"}`],
      );
      list.appendChild(
        el("div", { class: "list-item" }, [
          el("div", { class: "ic" }, [it.emoji]),
          el("div", { class: "body" }, [
            el("div", { class: "t1" }, [it.name]),
            el("div", { class: "t2" }, [`Цена: ${it.price} ${it.currency === "stars" ? "звёзд" : "монет"}`]),
          ]),
          el("div", { class: "act" }, [btn]),
        ]),
      );
    }
  } catch (e) {
    list.appendChild(el("div", { class: "empty" }, [e.message || "Ошибка"]));
  }
}

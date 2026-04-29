import { api } from "../api.js";
import { el, toast } from "../ui.js";

export async function renderTasks(root, ctx) {
  root.innerHTML = "";
  root.appendChild(el("div", { class: "screen-title" }, ["Задания"]));
  const list = el("div", { class: "list" });
  root.appendChild(list);
  list.appendChild(el("div", { class: "empty" }, ["Загрузка..."]));
  try {
    const tasks = await api.tasks();
    list.innerHTML = "";
    if (!tasks.length) {
      list.appendChild(el("div", { class: "empty" }, ["Заданий пока нет"]));
      return;
    }
    for (const t of tasks) {
      const btn = el(
        "button",
        {
          class: "btn",
          disabled: !t.can_claim,
          onclick: async () => {
            if (t.url) window.open(t.url, "_blank");
            try {
              const res = await api.claimTask(t.key);
              toast(`+${t.reward} ${t.currency === "stars" ? "⭐" : "🪙"}`, "win");
              ctx.user.balance = res.new_balance;
              ctx.user.stars = res.new_stars;
              ctx.refreshHeader && ctx.refreshHeader();
              renderTasks(root, ctx);
            } catch (e) {
              toast(e.message || "Ошибка", "err");
            }
          },
        },
        [t.completed && !t.repeatable ? "Готово" : t.can_claim ? `+${t.reward}` : (t.url ? "Перейти" : "Ждать")],
      );
      const item = el("div", { class: "list-item" }, [
        el("div", { class: "ic" }, [t.key === "subscribe_channel" ? "📢" : t.key === "invite_friend" ? "👥" : "🎁"]),
        el("div", { class: "body" }, [
          el("div", { class: "t1" }, [t.title]),
          el("div", { class: "t2" }, [t.description]),
          el("div", { class: "t3" }, [`${t.reward} ${t.currency === "stars" ? "⭐" : "монет"}`]),
        ]),
        el("div", { class: "act" }, [btn]),
      ]);
      list.appendChild(item);
    }
  } catch (e) {
    list.innerHTML = "";
    list.appendChild(el("div", { class: "empty" }, [e.message || "Ошибка загрузки"]));
  }
}

import { api, tg } from "../api.js";
import { el, openModal, toast } from "../ui.js";

export async function showReferralModal() {
  const root = el("div");
  root.appendChild(el("div", { class: "screen-title" }, ["Рефералы"]));
  const info = el("div", { class: "empty" }, ["Загрузка..."]);
  root.appendChild(info);
  openModal(root);
  try {
    const data = await api.referral();
    root.removeChild(info);
    const linkBox = el("div", { class: "list-item" }, [
      el("div", { class: "ic" }, ["🔗"]),
      el("div", { class: "body" }, [
        el("div", { class: "t1" }, ["Твоя ссылка"]),
        el("div", { class: "t2", style: "word-break: break-all;" }, [data.link]),
        el("div", { class: "t3" }, [`+${data.reward_per_invite} монет за каждого друга`]),
      ]),
    ]);
    const stats = el("div", { class: "list-item" }, [
      el("div", { class: "ic" }, ["👥"]),
      el("div", { class: "body" }, [
        el("div", { class: "t1" }, [`Приглашено: ${data.count}`]),
        el("div", { class: "t2" }, ["Делись ссылкой и получай бонусы"]),
      ]),
    ]);
    const actions = el(
      "div",
      { style: "display:flex; gap:8px; margin-top:12px; justify-content:center;" },
      [
        el(
          "button",
          {
            class: "btn",
            onclick: async () => {
              try {
                await navigator.clipboard.writeText(data.link);
                toast("Ссылка скопирована", "win");
              } catch (_) {
                toast("Не удалось скопировать", "err");
              }
            },
          },
          ["Скопировать"],
        ),
        el(
          "button",
          {
            class: "btn outline",
            onclick: () => {
              const text = encodeURIComponent("Залетай в VIRUS GAME BOT! 🎰");
              const url = `https://t.me/share/url?url=${encodeURIComponent(data.link)}&text=${text}`;
              if (tg && tg.openTelegramLink) tg.openTelegramLink(url);
              else window.open(url, "_blank");
            },
          },
          ["Поделиться"],
        ),
      ],
    );
    root.appendChild(linkBox);
    root.appendChild(stats);
    root.appendChild(actions);
  } catch (e) {
    info.textContent = e.message || "Ошибка";
  }
}

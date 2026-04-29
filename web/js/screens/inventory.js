import { api } from "../api.js";
import { el, openModal } from "../ui.js";

export async function showInventoryModal() {
  const root = el("div");
  root.appendChild(el("div", { class: "screen-title" }, ["Инвентарь"]));
  const grid = el("div", { class: "inv-grid" });
  root.appendChild(grid);
  grid.appendChild(el("div", { class: "empty" }, ["Загрузка..."]));
  openModal(root);
  try {
    const items = await api.inventory();
    grid.innerHTML = "";
    if (!items.length) {
      grid.appendChild(el("div", { class: "empty" }, ["Инвентарь пуст"]));
      return;
    }
    for (const it of items) {
      grid.appendChild(
        el("div", { class: "inv-card" }, [
          el("div", { class: "e" }, [it.emoji]),
          el("div", { class: "n" }, [it.name]),
          el("div", { class: "q" }, [`x${it.qty}`]),
        ]),
      );
    }
  } catch (e) {
    grid.innerHTML = "";
    grid.appendChild(el("div", { class: "empty" }, [e.message || "Ошибка"]));
  }
}

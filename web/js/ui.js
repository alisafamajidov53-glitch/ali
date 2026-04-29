export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function toast(message, kind = "info") {
  const host = document.getElementById("toast-host");
  const t = el("div", { class: `toast ${kind === "win" ? "win" : kind === "err" ? "err" : ""}` }, [message]);
  host.appendChild(t);
  setTimeout(() => t.remove(), 2900);
}

export function openModal(content) {
  const m = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  body.innerHTML = "";
  if (typeof content === "string") body.innerHTML = content;
  else body.appendChild(content);
  m.classList.remove("hidden");
}

export function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.dataset.close === "1") closeModal();
});

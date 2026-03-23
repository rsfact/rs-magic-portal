import { get_auth_token } from "./common.js";

const PORTAL_TITLE = "ポータル";

const LINK_CARDS = [
    { title: "サンプルリンク1", url: "https://example.com", icon_class: "fa-solid fa-link" },
    { title: "サンプルリンク2", url: "https://example.org", icon_class: "fa-solid fa-wand-magic-sparkles" },
    { title: "サンプルリンク3", url: "https://example.net", icon_class: "fa-solid fa-circle-info" },
    { title: "サンプルリンク4", url: "https://example.edu", icon_class: "fa-solid fa-layer-group" },
];

function redirect_to_login() {
    const login = new URL("login.html", window.location.href).toString();
    window.location.assign(login);
}

function set_modal_visible(visible) {
    const modal = document.getElementById("nfc-modal");
    if (!modal) return;
    modal.classList.toggle("hidden", !visible);
}

function set_modal_message(message) {
    const el = document.getElementById("nfc-message");
    if (!el) return;
    el.textContent = message;
}

function render_cards() {
    const container = document.getElementById("cards");
    if (!container) return;

    container.innerHTML = "";
    for (const c of LINK_CARDS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "w-full bg-white rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary,#799BF9)]";
        btn.setAttribute("aria-label", c.title);

        btn.innerHTML = `<div class="flex items-center gap-3"><i class="${c.icon_class} text-[var(--color-primary,#799BF9)] text-lg"></i><div class="font-semibold leading-tight">${c.title}</div></div>`;

        btn.addEventListener("click", () => on_card_clicked(c.url));
        container.appendChild(btn);
    }
}

async function on_card_clicked(url) {
    set_modal_visible(true);
    set_modal_message("カードをタッチしてください");

    if (!("NDEFReader" in window)) {
        set_modal_message("この端末ではWeb NFCが利用できません");
        return;
    }

    try {
        const ndef = new NDEFReader();
        ndef.onreading = () => { set_modal_visible(false); window.location.assign(url); };
        await ndef.scan();
    } catch {
        set_modal_message("NFC読み取りを開始できませんでした");
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    document.title = PORTAL_TITLE;
    if (!get_auth_token()) {
        redirect_to_login();
        return;
    }
    render_cards();

    const modal_close = document.getElementById("nfc-close");
    if (modal_close) {
        modal_close.addEventListener("click", () => {
            set_modal_visible(false);
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") set_modal_visible(false);
    });
});


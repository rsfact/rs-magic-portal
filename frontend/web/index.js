import {
    api_get,
    api_post,
    clear_auth_token,
    escape_html,
    first_error_message,
    get_auth_token,
    set_auth_token,
    token_authorization_header,
} from "./common.js";

const LOGIN_URL = new URL("login.html", window.location.href).toString();

function set_status(msg, is_error = false) {
    const el = document.getElementById("status");
    el.textContent = msg;
    el.classList.toggle("text-[var(--color-danger)]", is_error);
    el.classList.toggle("text-gray-500", !is_error);
}

async function refresh_token() {
    const token = get_auth_token();
    if (!token) return null;
    set_status("トークンを更新中...");
    const res = await api_post("/auth/users/refresh", {}, { headers: token_authorization_header(token) });
    if (res.ok && res.json?.success && res.json?.data?.token) {
        const next = res.json.data.token;
        set_auth_token(next);
        return next;
    }
    clear_auth_token();
    set_status("セッションの更新に失敗しました。再ログインしてください。", true);
    return null;
}

async function load_profile(token) {
    const res = await api_get("/auth/users/me", { headers: token_authorization_header(token) });
    if (res.ok && res.json?.success && res.json?.data) {
        return res.json.data;
    }
    return null;
}

async function load_apps(token) {
    const res = await api_post(
        "/v1/apps/search",
        { page: 1, size: 100 },
        { headers: token_authorization_header(token) },
    );
    if (res.ok && res.json?.success && res.json?.data?.items) {
        return res.json.data.items;
    }
    set_status(first_error_message(res.json) || "アプリ一覧の取得に失敗しました。", true);
    return null;
}

function card_html(app) {
    const name = escape_html(app.name);
    const desc = escape_html(app.description);
    const icon = escape_html(app.fa_icon || "fa-solid fa-grid-2");
    return `<div class="rounded-2xl bg-white border border-gray-200 p-6 min-h-[220px] hover:-translate-y-0.5 transition transform shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
<div class="flex flex-col h-full">
<div class="flex items-start gap-3">
<div class="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
<i class="${icon} text-[var(--color-primary)] text-lg"></i>
</div>
<div class="min-w-0">
<div class="font-semibold leading-tight text-base">${name}</div>
<div class="text-xs text-gray-500 mt-1 leading-relaxed">${desc}</div>
</div>
</div>
<div class="flex-1"></div>
<button type="button" class="app-launch w-full rounded-xl bg-[var(--color-primary)] text-white py-3 cursor-pointer hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]">
起動 <i class="fa-solid fa-arrow-right ml-2"></i>
</button>
</div>
</div>`;
}

window.addEventListener("DOMContentLoaded", async () => {
    document.title = "マジックポータル™";
    const token = await refresh_token();
    if (!token) return void window.location.assign(LOGIN_URL);

    document.getElementById("logout-button").addEventListener("click", () => {
        clear_auth_token();
        window.location.assign(LOGIN_URL);
    });

    const profile = await load_profile(token);
    if (profile?.role === "admin") {
        document.getElementById("admin-link").classList.remove("hidden");
    }

    set_status("アプリを読み込み中...");
    const items = await load_apps(token);
    if (items == null) return;

    const container = document.getElementById("apps");
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 col-span-full">アプリはまだありません。</p>';
        set_status("");
        return;
    }

    for (const app of items) {
        const wrap = document.createElement("div");
        wrap.innerHTML = card_html(app);
        const el = wrap.firstElementChild;
        const url = app.url;
        const go = () => {
            if (url) window.location.assign(url);
        };
        el.addEventListener("click", () => go());
        container.appendChild(el);
    }

    set_status("");
});

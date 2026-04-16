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

async function refresh_token(expire_seconds = null) {
    const token = get_auth_token();
    if (!token) return null;
    const body = expire_seconds ? { expire_seconds } : {};
    const res = await api_post("/auth/refresh", body, { headers: token_authorization_header(token) });
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
    const res = await api_get("/auth/me", { headers: token_authorization_header(token) });
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
    const icon = escape_html(app.fa_icon || "fa-solid fa-link");
    return `<div class="relative rounded-xl bg-white border border-slate-100 p-6 min-h-[200px] hover:border-[var(--color-primary)] transition shadow-sm cursor-pointer group">
${app.is_send_token_enabled ? '<div class="absolute top-4 right-4 text-[var(--color-success)] text-[10px] font-bold flex items-center gap-1.5"><i class="fa-solid fa-shield-halved"></i> 自動ログイン</div>' : ""}
<div class="flex flex-col h-full">
<div class="flex items-start gap-4">
<div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-[var(--color-primary)] transition-colors">
<i class="${icon} text-lg"></i>
</div>
<div class="min-w-0">
<div class="font-medium leading-tight text-slate-700">${name}</div>
<div class="text-xs text-slate-400 mt-2 description-text leading-relaxed">${desc}</div>
</div>
</div>
<div class="flex-1"></div>
<div class="flex gap-1.5 mt-6">
<button type="button" class="app-launch flex-[4] rounded-lg bg-[var(--color-primary)] text-white py-2.5 text-sm font-medium cursor-pointer hover:opacity-90 transition shadow-sm">
起動する
</button>
<button type="button" class="app-newtab flex-[1] rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] py-2.5 text-sm font-medium cursor-pointer hover:bg-[var(--color-primary)]/20 transition shadow-sm flex items-center justify-center">
<i class="fa-solid fa-arrow-up-right-from-square"></i>
</button>
</div>
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

    const items = await load_apps(token);
    if (!items) return;

    const container = document.getElementById("apps");
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center">アプリはまだありません。</p>';
        return;
    }

    for (const app of items.sort((a,b) => a.position - b.position)) {
        const wrap = document.createElement("div");
        wrap.innerHTML = card_html(app);
        const el = wrap.firstElementChild;
        
        const getUrl = async () => {
            if (!app.url) return null;
            if (app.is_send_token_enabled) {
                const t = await refresh_token(30);
                if (t) {
                    const sep = app.url.includes('#') ? '&' : '#';
                    return app.url + sep + 'token=' + encodeURIComponent(t);
                }
            }
            return app.url;
        };

        el.querySelector(".app-newtab").addEventListener("click", async (e) => {
            e.stopPropagation();
            const u = await getUrl();
            if (u) window.open(u, "_blank");
        });

        el.addEventListener("click", async () => {
            const u = await getUrl();
            if (u) window.location.assign(u);
        });

        container.appendChild(el);
    }
});

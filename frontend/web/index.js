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
import { NFC_USER_ID_PATTERN } from "./config.js";

const LOGIN_URL = new URL("login.html", window.location.href).toString();
const MGP_MAGIC_LOGIN_KEY = "mgp_is_enable_magic_login";

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

async function impersonate_login(user_id) {
    const token = get_auth_token();
    if (!token) return null;
    const res = await api_post("/auth/impersonate",
        { user_id, expire_minutes: 1 },
        { headers: token_authorization_header(token) },
    );
    if (res.ok && res.json?.success && res.json?.data?.token) {
        return res.json.data.token;
    }
    set_status("代理ログインに失敗しました。", true);
    return null;
}

function show_nfc_modal() {
    if (!("NDEFReader" in window)) {
        set_status("このブラウザはNFCに対応していません。", true);
        return Promise.resolve(null);
    }
    const modal = document.getElementById("nfc-modal");
    const status_el = document.getElementById("nfc-status");
    const cancel_btn = document.getElementById("nfc-cancel");
    const controller = new AbortController();

    modal.classList.remove("hidden");
    status_el.textContent = "";

    return new Promise((resolve) => {
        let resolved = false;
        const done = (val) => {
            if (resolved) return;
            resolved = true;
            modal.classList.add("hidden");
            resolve(val);
        };

        cancel_btn.onclick = () => { controller.abort(); done(null); };

        const reader = new NDEFReader();
        reader.scan({ signal: controller.signal }).then(() => {
            status_el.textContent = "待機中...";
            reader.onreading = (event) => {
                for (const record of event.message.records) {
                    let raw = null;
                    if (record.recordType === "url") {
                        raw = new TextDecoder().decode(record.data);
                    } else if (record.recordType === "text") {
                        raw = new TextDecoder(record.encoding).decode(record.data);
                    }
                    if (!raw) continue;
                    const m = raw.match(NFC_USER_ID_PATTERN);
                    if (m) { done(m[1]); return; }
                }
                status_el.textContent = "カードを読み取れませんでした";
            };
        }).catch(() => done(null));
    });
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
<div class="absolute top-4 right-4 flex items-center gap-2">
${app.is_send_token_enabled ? '<span class="text-[var(--color-success)] text-[10px] font-bold flex items-center gap-1.5"><i class="fa-solid fa-shield-halved"></i> 自動ログイン</span>' : ""}
<button type="button" class="app-copy-url text-slate-300 hover:text-[var(--color-primary)] transition text-sm cursor-pointer"><i class="fa-solid fa-link"></i></button>
</div>
<div class="flex flex-col h-full">
<div class="flex items-start gap-4 mt-4">
<div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-[var(--color-primary)] transition-colors">
<i class="${icon} text-lg"></i>
</div>
<div class="min-w-0">
<div class="font-medium leading-tight text-slate-700">${name}</div>
<div class="text-xs text-slate-400 mt-2 description-text leading-relaxed">${desc}</div>
</div>
</div>
<div class="flex-1"></div>
<div class="mt-6">
<button type="button" class="app-launch w-full rounded-lg bg-[var(--color-primary)] text-white py-2.5 text-sm font-medium cursor-pointer hover:opacity-90 transition shadow-sm">
起動する
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
            if (!app.is_send_token_enabled) return app.url;

            let t;
            if (localStorage.getItem(MGP_MAGIC_LOGIN_KEY)) {
                const user_id = await show_nfc_modal();
                if (!user_id) return null;
                t = await impersonate_login(user_id);
            } else {
                t = await refresh_token(30);
            }
            if (!t) return null;
            const sep = app.url.includes('#') ? '&' : '#';
            return app.url + sep + 'token=' + encodeURIComponent(t);
        };

        el.querySelector(".app-copy-url").addEventListener("click", (e) => {
            e.stopPropagation();
            if (app.url) navigator.clipboard.writeText(app.url);
        });

        el.querySelector(".app-launch").addEventListener("click", async (e) => {
            e.stopPropagation();
            const u = await getUrl();
            if (u) window.open(u, "_blank");
        });

        container.appendChild(el);
    }
});

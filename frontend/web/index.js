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
import { NFC_DATA_IS_URL, NFC_USER_ID_PATTERN } from "./config.js";

const LOGIN_URL = new URL("login.html", window.location.href).toString();
const MGP_MAGIC_LOGIN_KEY = "mgp_is_enable_magic_login";
const MGP_PENDING_KEY = "mgp_magic_login_pending";
const PENDING_TTL_MS = 60_000;

function extract_handoff_token() {
    const hash = window.location.hash;
    const m = hash.match(/[#&]token=([^&]+)/);
    if (!m) return null;
    const token = decodeURIComponent(m[1]);
    const cleaned = hash.replace(/[#&]token=[^&]+/, "").replace(/^#&/, "#").replace(/^#$/, "");
    history.replaceState(null, "", window.location.pathname + window.location.search + cleaned);
    return token;
}

async function handoff(incoming_token) {
    const res = await api_post("/auth/handoff", {}, { headers: token_authorization_header(incoming_token) });
    if (res.ok && res.json?.success && res.json?.data?.token) {
        set_auth_token(res.json.data.token);
        return res.json.data.token;
    }
    return null;
}

function set_status(msg, is_error = false) {
    const el = document.getElementById("status");
    el.textContent = msg;
    el.classList.toggle("text-[var(--color-danger)]", is_error);
    el.classList.toggle("text-gray-500", !is_error);
}

async function refresh_token() {
    const token = get_auth_token();
    if (!token) return null;
    const res = await api_post("/auth/refresh", {}, { headers: token_authorization_header(token) });
    if (res.ok && res.json?.success && res.json?.data?.token) {
        const next = res.json.data.token;
        set_auth_token(next);
        return next;
    }
    clear_auth_token();
    set_status("セッションの更新に失敗しました。再ログインしてください。", true);
    return null;
}

async function create_handoff_token() {
    const token = get_auth_token();
    if (!token) return null;
    const res = await api_post("/auth/refresh", { expire_seconds: 30 }, { headers: token_authorization_header(token) });
    if (res.ok && res.json?.success && res.json?.data?.token) {
        return res.json.data.token;
    }
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

function read_pending() {
    const raw = localStorage.getItem(MGP_PENDING_KEY);
    if (!raw) return null;
    try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.expires_at === "number" && obj.expires_at > Date.now()) return obj;
    } catch {}
    localStorage.removeItem(MGP_PENDING_KEY);
    return null;
}

function write_pending(app_url) {
    localStorage.setItem(MGP_PENDING_KEY, JSON.stringify({
        app_url,
        expires_at: Date.now() + PENDING_TTL_MS,
    }));
}

function clear_pending() {
    localStorage.removeItem(MGP_PENDING_KEY);
}

function append_token_to_url(url, token) {
    const sep = url.includes('#') ? '&' : '#';
    return url + sep + 'token=' + encodeURIComponent(token);
}

// URL方式: NFC カードのタッチ(OS が新タブで着地URLを開く)を待つだけのモーダル。
// 着地側で clear_pending() されると storage イベントで自動的に閉じる。
function show_wait_modal() {
    const modal = document.getElementById("nfc-modal");
    const status_el = document.getElementById("nfc-status");
    const cancel_btn = document.getElementById("nfc-cancel");

    modal.classList.remove("hidden");
    status_el.textContent = "待機中...";

    const on_storage = (e) => {
        if (e.key === MGP_PENDING_KEY && !e.newValue) close();
    };
    const close = () => {
        modal.classList.add("hidden");
        window.removeEventListener("storage", on_storage);
        cancel_btn.onclick = null;
    };
    cancel_btn.onclick = () => { clear_pending(); close(); };
    window.addEventListener("storage", on_storage);
}

// Web NFC API方式: モーダル内で NDEFReader.scan() を起動し、読み取った値から user_id を抽出する。
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

// URL方式の着地ロジック。?u=... を含むURLでアクセスされたときに呼ばれる。
// 戻り値: true なら別画面/別URLへ遷移を開始した(以降の通常処理は不要)。
async function handle_landing(params) {
    const rdr = params.get("rdr");
    const m = window.location.href.match(NFC_USER_ID_PATTERN);
    const user_id = m ? m[1] : null;
    const pending = read_pending();

    if (!pending) {
        // 待機外: 名刺カードとして rdr へ
        if (rdr) { window.location.replace(rdr); return true; }
        return false;
    }

    clear_pending();
    if (!user_id) return false;

    const token = await refresh_token();
    if (!token) return false;

    const impersonated = await impersonate_login(user_id);
    if (!impersonated) return false;

    window.location.replace(append_token_to_url(pending.app_url, impersonated));
    return true;
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

function card_html(app, index) {
    const name = escape_html(app.name);
    const desc = escape_html(app.description);
    const icon = escape_html(app.fa_icon || "fa-solid fa-link");
    const delay = index * 60;
    return `<div class="card relative rounded-2xl p-5 animate-fade-up flex flex-col min-h-[180px]" style="animation-delay:${delay}ms">
<div class="absolute top-4 right-4 flex items-center gap-2">
${app.is_send_token_enabled ? '<span class="text-[var(--color-success)] text-[10px] font-medium flex items-center gap-1"><i class="fa-solid fa-shield-halved"></i></span>' : ""}
<button type="button" class="app-copy-url text-slate-300 hover:text-[var(--color-primary)] transition text-xs cursor-pointer"><i class="fa-solid fa-link"></i></button>
</div>
<div class="flex items-start gap-3.5 mt-3">
<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 flex items-center justify-center shrink-0 text-[var(--color-primary)]">
<i class="${icon} text-base"></i>
</div>
<div class="min-w-0 pt-0.5">
<div class="font-medium text-sm leading-tight">${name}</div>
<div class="text-xs text-slate-400 mt-1.5 description-text leading-relaxed">${desc}</div>
</div>
</div>
<div class="flex-1"></div>
<div class="mt-5">
<button type="button" class="app-launch btn-primary w-full rounded-lg py-2.5 text-sm font-medium">
起動
</button>
</div>
</div>`;
}

window.addEventListener("DOMContentLoaded", async () => {
    document.title = "マジックポータル™";

    // URL方式の着地モード: ?u=... があれば最優先で処理
    if (NFC_DATA_IS_URL) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("u")) {
            const handled = await handle_landing(params);
            if (handled) return;
            // 失敗/中断 → クエリを掃除して通常 flow に流す
            history.replaceState(null, "", window.location.pathname);
        }
    }

    const incoming = extract_handoff_token();
    let token;
    if (incoming) {
        token = await handoff(incoming);
        if (!token) token = await refresh_token();
    } else {
        token = await refresh_token();
    }
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

    const sorted = items.sort((a,b) => a.position - b.position);
    for (let i = 0; i < sorted.length; i++) {
        const app = sorted[i];
        const wrap = document.createElement("div");
        wrap.innerHTML = card_html(app, i);
        const el = wrap.firstElementChild;

        // コピーは常に自分用 handoff トークン。マジックログインは「起動」専用機能。
        el.querySelector(".app-copy-url").addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!app.url) return;
            let final = app.url;
            if (app.is_send_token_enabled) {
                const t = await create_handoff_token();
                if (!t) return;
                final = append_token_to_url(app.url, t);
            }
            navigator.clipboard.writeText(final);
        });

        el.querySelector(".app-launch").addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!app.url) return;
            if (!app.is_send_token_enabled) {
                window.open(app.url, "_blank");
                return;
            }

            const magic_on = !!localStorage.getItem(MGP_MAGIC_LOGIN_KEY);

            if (magic_on && NFC_DATA_IS_URL) {
                // URL方式: 待機フラグを立て、OS が着地URLを別タブで開くのを待つ。
                // 着地側で app_url + #token= に replace される。
                write_pending(app.url);
                show_wait_modal();
                return;
            }

            let t;
            if (magic_on) {
                const user_id = await show_nfc_modal();
                if (!user_id) return;
                t = await impersonate_login(user_id);
            } else {
                t = await create_handoff_token();
            }
            if (!t) return;
            window.open(append_token_to_url(app.url, t), "_blank");
        });

        container.appendChild(el);
    }
});

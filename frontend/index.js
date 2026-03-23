import { api_post, clear_auth_token, get_auth_token, set_auth_token, token_authorization_header } from "./common.js";

const CONTACT_APP_URL = "https://apps.kon-sys.net/lnk/ui/login";

const NIPPO_APP_FEED_BASE_URL = "https://d00-rsf002a.routes.rsf-node001.com/spk/ui/feed/kks-mgp-nippoh-";
const NIPPO_TENANT_ID = "101";

function build_url_from_template(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = vars?.[key];
        return encodeURIComponent(value == null ? "" : String(value));
    });
}

const APPS = [
    {
        id: "timeclock",
        title: "打刻アプリ",
        icon: "fa-solid fa-clock",
        link: `${CONTACT_APP_URL}?return_url={{portal_url}}#token={{token}}`,
        unlocked: false,
        coinCost: 1200,
        hint: "時間をサクッと管理"
    },
    {
        id: "exp_ai",
        title: "AI立替アプリ",
        icon: "fa-solid fa-receipt",
        link: `${CONTACT_APP_URL}?return_url={{portal_url}}#token={{token}}`,
        unlocked: false,
        coinCost: 2500,
        hint: "経費申請を賢く効率化"
    },
    {
        id: "message_board",
        title: "AI伝言板アプリ",
        icon: "fa-solid fa-comments",
        link: `${CONTACT_APP_URL}?return_url={{portal_url}}#token={{token}}`,
        unlocked: true,
        coinCost: 0,
        hint: "要点だけ、ちゃんと伝える"
    },
    {
        id: "nippo",
        title: "AI日報アプリ",
        icon: "fa-solid fa-book-open",
        link: `${NIPPO_APP_FEED_BASE_URL}{{tenant_id}}`,
        unlocked: true,
        coinCost: 0,
        hint: "日報を短時間で作成"
    },
    {
        id: "mail_edit",
        title: "メール文添削アプリ",
        icon: "fa-solid fa-pen-nib",
        link: `${CONTACT_APP_URL}?return_url={{portal_url}}#token={{token}}`,
        unlocked: true,
        coinCost: 0,
        hint: "丁寧で伝わる文章へ"
    }
];

function set_status(msg, is_error = false) {
    const el = document.getElementById("status");
    el.textContent = msg;
    el.classList.toggle("text-[var(--color-danger)]", is_error);
    el.classList.toggle("text-gray-500", !is_error);
}
async function refresh_mgp_token() {
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
function badge_html(app) {
    return app.unlocked
        ? `<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 text-[var(--color-primary)] px-2 py-1 text-xs font-semibold"><i class="fa-solid fa-unlock-keyhole"></i>アンロック済み</span>`
        : `<span class="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent,#FFA775)]/15 text-[var(--color-accent,#FFA775)] px-2 py-1 text-xs font-semibold"><i class="fa-solid fa-coins"></i>${app.coinCost} コイン</span>`;
}
function card_html(app) {
    const btn = app.unlocked
        ? `<button type="button" class="w-full rounded-xl bg-[var(--color-primary)] text-white py-3 cursor-pointer hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]">起動 <i class="fa-solid fa-arrow-right ml-2"></i></button>`
        : `<button type="button" class="mt-4 w-full rounded-xl bg-gray-100 text-gray-400 py-3 cursor-not-allowed pointer-events-none">解放が必要です</button>`;
    const overlay = app.unlocked
        ? ""
        : `<div class="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200 flex flex-col items-center justify-center p-6 text-center"><i class="${app.icon} text-gray-300 text-2xl mb-2"></i><div class="text-sm font-semibold text-gray-800 flex items-center gap-2"><i class="fa-solid fa-lock text-[var(--color-danger)]"></i>未解放</div><div class="mt-2 text-base font-semibold text-gray-800 leading-tight">${app.title}</div><div class="mt-1 text-xs text-gray-600 leading-relaxed">${app.hint}</div><div class="mt-3 text-xs text-gray-600 flex items-center gap-2 justify-center"><i class="fa-solid fa-coins text-[var(--color-accent,#FFA775)]"></i>あと ${app.coinCost} コイン</div></div>`;
    return `<div class="relative rounded-2xl bg-white border border-gray-200 p-6 min-h-[240px] hover:-translate-y-0.5 transition transform shadow-sm"><div class="flex flex-col h-full"><div class="flex items-start justify-between gap-4"><div class="flex items-start gap-3"><div class="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center"><i class="${app.icon} text-[var(--color-primary)] text-lg"></i></div><div><div class="font-semibold leading-tight text-base">${app.title}</div><div class="text-xs text-gray-500 mt-1 leading-relaxed">${app.hint}</div></div></div>${badge_html(app)}</div><div class="flex-1"></div>${btn}</div>${overlay}</div>`;
}

window.addEventListener("DOMContentLoaded", async () => {
    document.title = "マジックポータル™";
    const token = await refresh_mgp_token();
    if (!token) return void window.location.assign("login.html");
    document.getElementById("logout-button").addEventListener("click", () => {
        clear_auth_token();
        window.location.assign("login.html");
    });
    const container = document.getElementById("apps");
    container.innerHTML = "";
    [...APPS].sort((a, b) => Number(b.unlocked) - Number(a.unlocked)).forEach((app) => {
        const wrap = document.createElement("div");
        wrap.innerHTML = card_html(app);
        const el = wrap.firstElementChild;
        if (!el) return;
        el.classList.add(app.unlocked ? "cursor-pointer" : "cursor-not-allowed");
        el.addEventListener("click", (e) => {
            if (app.unlocked) {
                const url = build_url_from_template(app.link, {
                    portal_url: new URL("./portal.html", window.location.href).href,
                    token,
                    tenant_id: NIPPO_TENANT_ID
                });
                return void window.location.assign(url);
            }
            e.preventDefault();
            set_status(`${app.title} は未解放です（${app.coinCost} コイン）。`, true);
        });
        container.appendChild(el);
    });
    set_status("", false);
});


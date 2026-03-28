import {
    api_delete,
    api_get,
    api_patch,
    api_post,
    clear_auth_token,
    escape_html,
    first_error_message,
    get_auth_token,
    set_auth_token,
    token_authorization_header,
} from "./common.js";

const LOGIN_URL = new URL("login.html", window.location.href).toString();

let auth_token = "";

function form_status(msg, is_err = false) {
    const el = document.getElementById("form-status");
    el.textContent = msg;
    el.classList.toggle("text-[var(--color-danger)]", is_err);
    el.classList.toggle("text-gray-500", !is_err);
}

async function refresh_token() {
    const t = get_auth_token();
    if (!t) return null;
    const res = await api_post("/auth/users/refresh", {}, { headers: token_authorization_header(t) });
    if (res.ok && res.json?.success && res.json?.data?.token) {
        set_auth_token(res.json.data.token);
        return res.json.data.token;
    }
    clear_auth_token();
    return null;
}

async function load_profile() {
    const res = await api_get("/auth/users/me", { headers: token_authorization_header(auth_token) });
    if (res.ok && res.json?.success) return res.json.data;
    return null;
}

function reset_form() {
    document.getElementById("edit-id").value = "";
    document.getElementById("f-name").value = "";
    document.getElementById("f-desc").value = "";
    document.getElementById("f-icon").value = "";
    document.getElementById("f-url").value = "";
    document.getElementById("f-position").value = "";
    document.getElementById("f-position-wrap").classList.add("hidden");
    document.getElementById("cancel-edit").classList.add("hidden");
    document.getElementById("form-title").textContent = "新規アプリ";
    document.getElementById("submit-btn").textContent = "作成";
}

function fill_form(app) {
    document.getElementById("edit-id").value = app.id;
    document.getElementById("f-name").value = app.name || "";
    document.getElementById("f-desc").value = app.description || "";
    document.getElementById("f-icon").value = app.fa_icon || "";
    document.getElementById("f-url").value = app.url || "";
    document.getElementById("f-position").value = String(app.position ?? "");
    document.getElementById("f-position-wrap").classList.remove("hidden");
    document.getElementById("cancel-edit").classList.remove("hidden");
    document.getElementById("form-title").textContent = "アプリを編集";
    document.getElementById("submit-btn").textContent = "更新";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function load_apps() {
    const res = await api_post(
        "/v1/apps/search",
        { page: 1, size: 200 },
        { headers: token_authorization_header(auth_token) },
    );
    if (res.ok && res.json?.success && res.json?.data?.items) {
        return res.json.data.items;
    }
    return null;
}

function render_rows(apps) {
    const tbody = document.getElementById("app-rows");
    const empty = document.getElementById("list-empty");
    tbody.innerHTML = "";
    if (!apps.length) {
        empty.classList.remove("hidden");
        return;
    }
    empty.classList.add("hidden");
    for (const a of apps) {
        const tr = document.createElement("tr");
        tr.className = "border-b border-gray-100";
        const url_short = a.url.length > 40 ? `${escape_html(a.url.slice(0, 40))}…` : escape_html(a.url);
        tr.innerHTML = `<td class="py-2 pr-2">${a.position}</td>
<td class="py-2 pr-2 font-medium">${escape_html(a.name)}</td>
<td class="py-2 pr-2 hidden sm:table-cell"><span class="text-gray-600 break-all">${url_short}</span></td>
<td class="py-2">
<button type="button" class="edit-btn text-[var(--color-primary)] hover:underline mr-2" data-id="${escape_html(a.id)}">編集</button>
<button type="button" class="del-btn text-[var(--color-danger)] hover:underline" data-id="${escape_html(a.id)}">削除</button>
</td>`;
        tbody.appendChild(tr);
    }

    tbody.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const app = apps.find((x) => x.id === id);
            if (app) fill_form(app);
        });
    });

    tbody.querySelectorAll(".del-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            if (!confirm("このアプリを削除しますか？")) return;
            const res = await api_delete(`/v1/apps/${encodeURIComponent(id)}`, {
                headers: token_authorization_header(auth_token),
            });
            if (res.ok && res.json?.success) {
                form_status("削除しました。");
                reset_form();
                await refresh_table();
                return;
            }
            form_status(first_error_message(res.json) || "削除に失敗しました。", true);
        });
    });
}

async function refresh_table() {
    const apps = await load_apps();
    if (apps) render_rows(apps);
}

async function on_submit(e) {
    e.preventDefault();
    const id = document.getElementById("edit-id").value.trim();
    const name = document.getElementById("f-name").value.trim();
    const description = document.getElementById("f-desc").value.trim();
    const fa_icon_raw = document.getElementById("f-icon").value.trim();
    const url = document.getElementById("f-url").value.trim();
    const pos_raw = document.getElementById("f-position").value.trim();

    if (!name || !description || !url) {
        form_status("名前・説明・URLは必須です。", true);
        return;
    }

    form_status("保存中…");

    if (id) {
        const body = { name, description, url };
        if (fa_icon_raw) body.fa_icon = fa_icon_raw;
        if (pos_raw !== "") {
            const n = Number(pos_raw);
            if (Number.isFinite(n)) body.position = n;
        }
        const res = await api_patch(`/v1/apps/${encodeURIComponent(id)}`, body, {
            headers: token_authorization_header(auth_token),
        });
        if (res.ok && res.json?.success) {
            form_status("更新しました。");
            reset_form();
            await refresh_table();
            return;
        }
        form_status(first_error_message(res.json) || "更新に失敗しました。", true);
        return;
    }

    const body = { name, description, url };
    if (fa_icon_raw) body.fa_icon = fa_icon_raw;
    const res = await api_post("/v1/apps/create", body, {
        headers: token_authorization_header(auth_token),
    });
    if (res.ok && res.json?.success) {
        form_status("作成しました。");
        reset_form();
        await refresh_table();
        return;
    }
    form_status(first_error_message(res.json) || "作成に失敗しました。", true);
}

window.addEventListener("DOMContentLoaded", async () => {
    auth_token = await refresh_token();
    if (!auth_token) return void window.location.assign(LOGIN_URL);

    const profile = await load_profile();
    if (!profile || profile.role !== "admin") {
        document.getElementById("gate-msg").textContent =
            "この画面は管理者（admin）のみ利用できます。";
        document.getElementById("gate-msg").classList.remove("hidden");
        return;
    }

    document.getElementById("editor").classList.remove("hidden");
    reset_form();
    document.getElementById("app-form").addEventListener("submit", on_submit);
    document.getElementById("cancel-edit").addEventListener("click", () => {
        reset_form();
        form_status("");
    });

    await refresh_table();
});

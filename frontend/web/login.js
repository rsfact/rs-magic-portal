import { api_post, first_error_message, get_auth_token, set_auth_token } from "./common.js";

const INDEX_URL = new URL("index.html", window.location.href).toString();

function sync_signin_button() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    document.getElementById("signin-button").disabled = !email || !password;
}

async function submit_login(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return;

    const btn = document.getElementById("signin-button");
    const status = document.getElementById("status");
    btn.disabled = true;
    status.textContent = "ログイン中...";

    try {
        const res = await api_post("/auth/users/login", { email, password });
        if (res.ok && res.json?.success && res.json?.data?.token) {
            set_auth_token(res.json.data.token);
            window.location.assign(INDEX_URL);
            return;
        }
        status.textContent =
            first_error_message(res.json) || "ログインに失敗しました。";
    } catch {
        status.textContent = "通信に失敗しました。";
    } finally {
        btn.disabled = false;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const token = get_auth_token();
    if (token) {
        window.location.assign(INDEX_URL);
        return;
    }

    sync_signin_button();
    document.getElementById("login-form").addEventListener("submit", submit_login);
    document.getElementById("email").addEventListener("input", sync_signin_button);
    document.getElementById("password").addEventListener("input", sync_signin_button);
});

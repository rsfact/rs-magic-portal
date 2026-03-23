import { API_BASE_URL, AUTH_TOKEN_KEY } from "./config.js";

export function get_auth_token() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function set_auth_token(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clear_auth_token() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function api_post(path, body, { headers = {} } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body ?? {}),
    });
    let json = null;
    try {
        json = await res.json();
    } catch {
        json = null;
    }
    return { ok: res.ok, status: res.status, json };
}

export function token_authorization_header(token) {
    return { Authorization: `Bearer ${token}` };
}


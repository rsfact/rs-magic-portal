import { API_BASE_URL } from "./config.js";

const MGP_TOKEN_KEY = "mgp_token";

export function get_auth_token() {
    return localStorage.getItem(MGP_TOKEN_KEY) || "";
}

export function set_auth_token(token) {
    localStorage.setItem(MGP_TOKEN_KEY, token);
}

export function clear_auth_token() {
    localStorage.removeItem(MGP_TOKEN_KEY);
}

export function token_authorization_header(token) {
    return { Authorization: `Bearer ${token}` };
}

export function first_error_message(json) {
    const e = json?.errors?.[0];
    return e?.msg || e?.message || "";
}

export function escape_html(s) {
    const t = document.createElement("textarea");
    t.textContent = s == null ? "" : String(s);
    return t.innerHTML;
}

async function parse_json_res(res) {
    let json = null;
    try {
        json = await res.json();
    } catch {
        json = null;
    }
    return { ok: res.ok, status: res.status, json };
}

export async function api_get(path, { headers = {} } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: { ...headers },
    });
    return parse_json_res(res);
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
    return parse_json_res(res);
}

export async function api_patch(path, body, { headers = {} } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body ?? {}),
    });
    return parse_json_res(res);
}

export async function api_delete(path, { headers = {} } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "DELETE",
        headers: { ...headers },
    });
    return parse_json_res(res);
}

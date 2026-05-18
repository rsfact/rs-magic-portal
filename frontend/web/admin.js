import {
    api_delete,
    api_get,
    api_patch,
    api_post,
    clear_auth_token,
    get_auth_token,
    set_auth_token,
    token_authorization_header,
    first_error_message,
} from "./common.js";

const LOGIN_URL = new URL("login.html", window.location.href).toString();

const start = () => {
    Alpine.data('appManager', () => ({
        apps: [],
        profile: null,
        gateMsg: '',
        status: { msg: '', isErr: false },
        isLoading: true,
        formData: { id: '', name: '', description: '', url: '', fa_icon: '', is_send_token_enabled: false },
        token: '',
        isMagicLoginEnabled: !!localStorage.getItem('mgp_is_enable_magic_login'),

        toggleMagicLogin() {
            if (this.isMagicLoginEnabled) {
                localStorage.setItem('mgp_is_enable_magic_login', '1');
            } else {
                localStorage.removeItem('mgp_is_enable_magic_login');
            }
        },

        async init() {
            this.token = await this.refreshToken();
            if (!this.token) return window.location.assign(LOGIN_URL);

            this.profile = await this.loadProfile();
            if (!this.profile || this.profile.role !== 'admin') {
                this.gateMsg = '管理者専用画面です。';
                return;
            }
            await this.refreshTable();
            this.isLoading = false;

            this.$nextTick(() => {
                Sortable.create(this.$refs.sortableList, {
                    handle: '.handle',
                    ghostClass: 'sortable-ghost',
                    onEnd: (evt) => {
                        const id = evt.item.dataset.id;
                        const newPos = evt.newIndex + 1;
                        this.updatePosition(id, newPos);
                    }
                });
            });
        },

        async refreshToken() {
            const t = get_auth_token();
            if (!t) return null;
            const res = await api_post("/auth/refresh", {}, { headers: token_authorization_header(t) });
            if (res.ok && res.json?.success && res.json?.data?.token) {
                set_auth_token(res.json.data.token);
                return res.json.data.token;
            }
            clear_auth_token();
            return null;
        },

        async loadProfile() {
            const res = await api_get("/auth/me", { headers: token_authorization_header(this.token) });
            return (res.ok && res.json?.success) ? res.json.data : null;
        },

        async refreshTable() {
            const res = await api_post("/v1/apps/search", { page: 1, size: 200 }, { headers: token_authorization_header(this.token) });
            if (res.ok && res.json?.success) {
                this.apps = res.json.data.items.sort((a, b) => a.position - b.position);
            }
        },

        resetForm() {
            this.formData = { id: '', name: '', description: '', url: '', fa_icon: '', is_send_token_enabled: false };
            this.status = { msg: '', isErr: false };
        },

        editApp(app) {
            this.formData = { ...app };
            this.status = { msg: '', isErr: false };
            window.scrollTo({ top: 0, behavior: "smooth" });
        },

        async submitForm() {
            this.status = { msg: '保存中...', isErr: false };
            const isEdit = !!this.formData.id;
            const res = await (isEdit ? api_patch : api_post)(
                isEdit ? `/v1/apps/${encodeURIComponent(this.formData.id)}` : "/v1/apps",
                this.formData,
                { headers: token_authorization_header(this.token) }
            );

            if (res.ok && res.json?.success) {
                this.status = { msg: isEdit ? '更新しました' : '登録しました', isErr: false };
                this.resetForm();
                await this.refreshTable();
                setTimeout(() => { this.status.msg = ''; }, 3000);
            } else {
                this.status = { msg: first_error_message(res.json) || '保存失敗', isErr: true };
            }
        },

        async updatePosition(id, newPos) {
            const res = await api_patch(`/v1/apps/${encodeURIComponent(id)}`, 
                { position: newPos }, 
                { headers: token_authorization_header(this.token) }
            );
            if (res.ok && res.json?.success) {
                await this.refreshTable();
            }
        },

        async deleteApp(id) {
            if (!confirm("削除しますか？")) return;
            const res = await api_delete(`/v1/apps/${encodeURIComponent(id)}`, { headers: token_authorization_header(this.token) });
            if (res.ok && res.json?.success) {
                this.resetForm();
                await this.refreshTable();
            } else {
                this.status = { msg: '削除失敗', isErr: true };
            }
        }
    }));
};

if (window.Alpine) {
    start();
} else {
    document.addEventListener('alpine:init', start);
}

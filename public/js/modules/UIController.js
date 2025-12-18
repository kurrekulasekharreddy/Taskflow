export class UIController {
    constructor() {
        this.currentView = 'dashboard';
        this.views = {};
        this.toastQueue = [];
        this.isAnimating = false;
        this.theme = localStorage.getItem('theme') || 'light';
    }

    initialize() {
        this.cacheViews();
        this.applyTheme(this.theme);
        return this;
    }

    cacheViews() {
        document.querySelectorAll('.view').forEach(view => {
            this.views[view.id.replace('view-', '')] = view;
        });
        return this;
    }

    getView(name) {
        return this.views[name] || null;
    }

    getCurrentView() {
        return this.currentView;
    }

    showView(viewName) {
        Object.values(this.views).forEach(view => {
            view.classList.remove('active');
        });

        const targetView = this.views[viewName];
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            window.scrollTo(0, 0);
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        return this;
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('hidden');
        return this;
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
        return this;
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return this;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return this;
    }

    showModal(title, message, onConfirm, onCancel) {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        const closeBtn = document.getElementById('modal-close');

        if (!overlay) return this;

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        overlay.classList.remove('hidden');

        const closeModal = () => {
            overlay.classList.add('hidden');
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            closeBtn.onclick = null;
        };

        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = closeBtn.onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };

        return this;
    }

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.add('hidden');
        return this;
    }

    toggleMenu() {
        const navLinks = document.getElementById('nav-links');
        if (navLinks) navLinks.classList.toggle('active');
        return this;
    }

    closeMenu() {
        const navLinks = document.getElementById('nav-links');
        if (navLinks) navLinks.classList.remove('active');
        return this;
    }

    setTheme(theme) {
        this.theme = theme;
        this.applyTheme(theme);
        localStorage.setItem('theme', theme);
        return this;
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        return this;
    }

    getTheme() {
        return this.theme;
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }

    renderEmptyState(container, icon, message, actionText, actionCallback) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <p>${message}</p>
                ${actionText ? `<button class="btn btn-primary empty-action">${actionText}</button>` : ''}
            </div>
        `;

        if (actionText && actionCallback) {
            container.querySelector('.empty-action').addEventListener('click', actionCallback);
        }

        return this;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatRelativeTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    }

    getIconForCategory(icon) {
        const icons = {
            folder: '📁',
            work: '💼',
            personal: '👤',
            shopping: '🛒',
            health: '❤️',
            education: '📚',
            finance: '💰',
            travel: '✈️'
        };
        return icons[icon] || '📁';
    }

    scrollToElement(element) {
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return this;
    }
}

export default new UIController();

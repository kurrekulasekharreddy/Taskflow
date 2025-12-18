export class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.retryAttempts = 3;
    }

    getBaseUrl() {
        return this.baseUrl;
    }

    setBaseUrl(url) {
        this.baseUrl = url;
        return this;
    }

    clearCache() {
        this.cache.clear();
        return this;
    }

    getCacheKey(endpoint, params) {
        return `${endpoint}?${JSON.stringify(params || {})}`;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(fullEndpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async getTasks(filters = {}) {
        return this.get('/tasks', filters);
    }

    async getTask(id) {
        return this.get(`/tasks/${id}`);
    }

    async createTask(data) {
        return this.post('/tasks', data);
    }

    async updateTask(id, data) {
        return this.put(`/tasks/${id}`, data);
    }

    async deleteTask(id) {
        return this.delete(`/tasks/${id}`);
    }

    async getCategories() {
        return this.get('/categories');
    }

    async getCategory(id) {
        return this.get(`/categories/${id}`);
    }

    async createCategory(data) {
        return this.post('/categories', data);
    }

    async updateCategory(id, data) {
        return this.put(`/categories/${id}`, data);
    }

    async deleteCategory(id) {
        return this.delete(`/categories/${id}`);
    }

    async getNotes(filters = {}) {
        return this.get('/notes', filters);
    }

    async getNote(id) {
        return this.get(`/notes/${id}`);
    }

    async createNote(data) {
        return this.post('/notes', data);
    }

    async updateNote(id, data) {
        return this.put(`/notes/${id}`, data);
    }

    async deleteNote(id) {
        return this.delete(`/notes/${id}`);
    }

    async getUsers() {
        return this.get('/users');
    }

    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async createUser(data) {
        return this.post('/users', data);
    }

    async updateUser(id, data) {
        return this.put(`/users/${id}`, data);
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    async getStats() {
        return this.get('/stats');
    }
}

export default new ApiService();

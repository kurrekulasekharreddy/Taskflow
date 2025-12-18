import apiService from './ApiService.js';

export class DataManager {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.notes = [];
        this.stats = null;
        this.currentUser = null;
        this.subscribers = new Map();
    }

    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
        return () => this.unsubscribe(event, callback);
    }

    unsubscribe(event, callback) {
        const subs = this.subscribers.get(event);
        if (subs) {
            const index = subs.indexOf(callback);
            if (index > -1) subs.splice(index, 1);
        }
        return this;
    }

    notify(event, data) {
        const subs = this.subscribers.get(event);
        if (subs) {
            subs.forEach(callback => callback(data));
        }
        return this;
    }

    getTasks() {
        return this.tasks;
    }

    getCategories() {
        return this.categories;
    }

    getNotes() {
        return this.notes;
    }

    getStats() {
        return this.stats;
    }

    getTaskById(id) {
        return this.tasks.find(t => t._id === id || t.id === id);
    }

    getCategoryById(id) {
        return this.categories.find(c => c._id === id || c.id === id);
    }

    getNoteById(id) {
        return this.notes.find(n => n._id === id || n.id === id);
    }

    async loadTasks(filters = {}) {
        try {
            this.tasks = await apiService.getTasks(filters);
            this.notify('tasksLoaded', this.tasks);
            return this.tasks;
        } catch (error) {
            this.notify('error', { type: 'loadTasks', error });
            throw error;
        }
    }

    async loadCategories() {
        try {
            this.categories = await apiService.getCategories();
            this.notify('categoriesLoaded', this.categories);
            return this.categories;
        } catch (error) {
            this.notify('error', { type: 'loadCategories', error });
            throw error;
        }
    }

    async loadNotes(filters = {}) {
        try {
            this.notes = await apiService.getNotes(filters);
            this.notify('notesLoaded', this.notes);
            return this.notes;
        } catch (error) {
            this.notify('error', { type: 'loadNotes', error });
            throw error;
        }
    }

    async loadStats() {
        try {
            this.stats = await apiService.getStats();
            this.notify('statsLoaded', this.stats);
            return this.stats;
        } catch (error) {
            this.notify('error', { type: 'loadStats', error });
            throw error;
        }
    }

    async createTask(data) {
        try {
            const task = await apiService.createTask(data);
            this.tasks.unshift(task);
            this.notify('taskCreated', task);
            return task;
        } catch (error) {
            this.notify('error', { type: 'createTask', error });
            throw error;
        }
    }

    async updateTask(id, data) {
        try {
            const task = await apiService.updateTask(id, data);
            const index = this.tasks.findIndex(t => t._id === id || t.id === id);
            if (index > -1) this.tasks[index] = task;
            this.notify('taskUpdated', task);
            return task;
        } catch (error) {
            this.notify('error', { type: 'updateTask', error });
            throw error;
        }
    }

    async deleteTask(id) {
        try {
            await apiService.deleteTask(id);
            this.tasks = this.tasks.filter(t => t._id !== id && t.id !== id);
            this.notify('taskDeleted', id);
            return true;
        } catch (error) {
            this.notify('error', { type: 'deleteTask', error });
            throw error;
        }
    }

    async createCategory(data) {
        try {
            const category = await apiService.createCategory(data);
            this.categories.push(category);
            this.notify('categoryCreated', category);
            return category;
        } catch (error) {
            this.notify('error', { type: 'createCategory', error });
            throw error;
        }
    }

    async updateCategory(id, data) {
        try {
            const category = await apiService.updateCategory(id, data);
            const index = this.categories.findIndex(c => c._id === id || c.id === id);
            if (index > -1) this.categories[index] = category;
            this.notify('categoryUpdated', category);
            return category;
        } catch (error) {
            this.notify('error', { type: 'updateCategory', error });
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            await apiService.deleteCategory(id);
            this.categories = this.categories.filter(c => c._id !== id && c.id !== id);
            this.notify('categoryDeleted', id);
            return true;
        } catch (error) {
            this.notify('error', { type: 'deleteCategory', error });
            throw error;
        }
    }

    async createNote(data) {
        try {
            const note = await apiService.createNote(data);
            this.notes.unshift(note);
            this.notify('noteCreated', note);
            return note;
        } catch (error) {
            this.notify('error', { type: 'createNote', error });
            throw error;
        }
    }

    async updateNote(id, data) {
        try {
            const note = await apiService.updateNote(id, data);
            const index = this.notes.findIndex(n => n._id === id || n.id === id);
            if (index > -1) this.notes[index] = note;
            this.notify('noteUpdated', note);
            return note;
        } catch (error) {
            this.notify('error', { type: 'updateNote', error });
            throw error;
        }
    }

    async deleteNote(id) {
        try {
            await apiService.deleteNote(id);
            this.notes = this.notes.filter(n => n._id !== id && n.id !== id);
            this.notify('noteDeleted', id);
            return true;
        } catch (error) {
            this.notify('error', { type: 'deleteNote', error });
            throw error;
        }
    }

    filterTasks(filters) {
        let result = [...this.tasks];

        if (filters.status) {
            result = result.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
            result = result.filter(t => t.priority === filters.priority);
        }
        if (filters.category) {
            result = result.filter(t => t.category === filters.category);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(search) ||
                (t.description && t.description.toLowerCase().includes(search))
            );
        }

        return result;
    }

    getTasksByDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === targetDate.getTime();
        });
    }

    getTaskDates() {
        const dates = new Set();
        this.tasks.forEach(task => {
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                dates.add(date.toISOString().split('T')[0]);
            }
        });
        return dates;
    }

    searchNotes(query) {
        const search = query.toLowerCase();
        return this.notes.filter(n =>
            (n.title && n.title.toLowerCase().includes(search)) ||
            n.content.toLowerCase().includes(search)
        );
    }

    exportData() {
        return {
            tasks: this.tasks,
            categories: this.categories,
            notes: this.notes,
            exportedAt: new Date().toISOString()
        };
    }
}

export default new DataManager();

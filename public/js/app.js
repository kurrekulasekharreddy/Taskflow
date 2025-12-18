import { ApiService } from './modules/ApiService.js';
import { UIController } from './modules/UIController.js';
import { FormValidator } from './modules/FormValidator.js';
import { DataManager } from './modules/DataManager.js';

const api = new ApiService();
const ui = new UIController();
const validator = new FormValidator();
const data = new DataManager();

let currentCalendarDate = new Date();
let selectedNoteColor = '#ffffa5';
let draggedTask = null;

document.addEventListener('DOMContentLoaded', function initApp() {
    ui.initialize();
    setupNavigation();
    setupTaskEvents();
    setupCategoryEvents();
    setupNoteEvents();
    setupCalendarEvents();
    setupProfileEvents();
    setupSettingsEvents();
    setupModalEvents();
    setupDragAndDrop();
    setupSearchAndFilters();
    setupQuickActions();
    loadInitialData();
});

function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelectorAll('.nav-link');

    menuToggle.addEventListener('click', function handleMenuToggle(e) {
        e.preventDefault();
        ui.toggleMenu();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function handleNavClick(e) {
            e.preventDefault();
            const viewName = this.dataset.view;
            ui.showView(viewName);
            ui.closeMenu();
            loadViewData(viewName);
        });
    });

    document.addEventListener('click', function handleOutsideClick(e) {
        const navbar = document.getElementById('navbar');
        if (!navbar.contains(e.target)) {
            ui.closeMenu();
        }
    });
}

function setupTaskEvents() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const quickAddTask = document.getElementById('quick-add-task');
    const taskForm = document.getElementById('task-form');
    const taskFormBack = document.getElementById('task-form-back');
    const taskCancelBtn = document.getElementById('task-cancel-btn');
    const taskDeleteBtn = document.getElementById('task-delete-btn');

    addTaskBtn.addEventListener('click', function handleAddTask() {
        openTaskForm();
    });

    quickAddTask.addEventListener('click', function handleQuickAddTask() {
        ui.showView('task-form');
        openTaskForm();
    });

    taskFormBack.addEventListener('click', function handleTaskFormBack() {
        ui.showView('tasks');
    });

    taskCancelBtn.addEventListener('click', function handleTaskCancel() {
        ui.showView('tasks');
    });

    taskForm.addEventListener('submit', async function handleTaskSubmit(e) {
        e.preventDefault();
        await saveTask();
    });

    taskDeleteBtn.addEventListener('click', async function handleTaskDelete() {
        const taskId = document.getElementById('task-id').value;
        if (taskId) {
            ui.showModal('Delete Task', 'Are you sure you want to delete this task?', async () => {
                try {
                    ui.showLoading();
                    await data.deleteTask(taskId);
                    ui.hideLoading();
                    ui.showToast('Task deleted', 'success');
                    ui.showView('tasks');
                    renderTasks();
                } catch (error) {
                    ui.hideLoading();
                    ui.showToast('Failed to delete task', 'error');
                }
            });
        }
    });

    document.getElementById('task-title-input').addEventListener('input', function handleTitleInput() {
        validator.clearFieldError(this);
    });

    document.getElementById('task-title-input').addEventListener('blur', function handleTitleBlur() {
        if (!this.value.trim()) {
            validator.showFieldError(this, 'Title is required');
        }
    });

    document.getElementById('task-description-input').addEventListener('input', function handleDescInput() {
        const charCount = this.value.length;
        if (charCount > 500) {
            validator.showFieldError(this, 'Maximum 500 characters');
        } else {
            validator.clearFieldError(this);
        }
    });

    document.getElementById('task-priority-input').addEventListener('change', function handlePriorityChange() {
        console.log('Priority changed to:', this.value);
    });

    document.getElementById('task-status-input').addEventListener('change', function handleStatusChange() {
        console.log('Status changed to:', this.value);
    });

    document.getElementById('task-due-date-input').addEventListener('change', function handleDueDateChange() {
        console.log('Due date changed to:', this.value);
    });
}

function setupCategoryEvents() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryForm = document.getElementById('category-form');
    const categoryFormBack = document.getElementById('category-form-back');
    const categoryCancelBtn = document.getElementById('category-cancel-btn');
    const categoryDeleteBtn = document.getElementById('category-delete-btn');

    addCategoryBtn.addEventListener('click', function handleAddCategory() {
        openCategoryForm();
    });

    categoryFormBack.addEventListener('click', function handleCategoryFormBack() {
        ui.showView('categories');
    });

    categoryCancelBtn.addEventListener('click', function handleCategoryCancel() {
        ui.showView('categories');
    });

    categoryForm.addEventListener('submit', async function handleCategorySubmit(e) {
        e.preventDefault();
        await saveCategory();
    });

    categoryDeleteBtn.addEventListener('click', async function handleCategoryDelete() {
        const categoryId = document.getElementById('category-id').value;
        if (categoryId) {
            ui.showModal('Delete Category', 'Are you sure?', async () => {
                try {
                    ui.showLoading();
                    await data.deleteCategory(categoryId);
                    ui.hideLoading();
                    ui.showToast('Category deleted', 'success');
                    ui.showView('categories');
                    renderCategories();
                } catch (error) {
                    ui.hideLoading();
                    ui.showToast('Failed to delete category', 'error');
                }
            });
        }
    });

    document.getElementById('category-name-input').addEventListener('input', function handleCatNameInput() {
        validator.clearFieldError(this);
    });

    document.getElementById('category-color-input').addEventListener('input', function handleColorInput() {
        console.log('Color selected:', this.value);
    });

    document.getElementById('category-icon-input').addEventListener('change', function handleIconChange() {
        console.log('Icon selected:', this.value);
    });
}

function setupNoteEvents() {
    const addNoteBtn = document.getElementById('add-note-btn');
    const quickAddNote = document.getElementById('quick-add-note');
    const noteForm = document.getElementById('note-form');
    const noteFormBack = document.getElementById('note-form-back');
    const noteCancelBtn = document.getElementById('note-cancel-btn');
    const noteDeleteBtn = document.getElementById('note-delete-btn');
    const colorOptions = document.querySelectorAll('.color-option');

    addNoteBtn.addEventListener('click', function handleAddNote() {
        openNoteForm();
    });

    quickAddNote.addEventListener('click', function handleQuickAddNote() {
        ui.showView('note-form');
        openNoteForm();
    });

    noteFormBack.addEventListener('click', function handleNoteFormBack() {
        ui.showView('notes');
    });

    noteCancelBtn.addEventListener('click', function handleNoteCancel() {
        ui.showView('notes');
    });

    noteForm.addEventListener('submit', async function handleNoteSubmit(e) {
        e.preventDefault();
        await saveNote();
    });

    noteDeleteBtn.addEventListener('click', async function handleNoteDelete() {
        const noteId = document.getElementById('note-id').value;
        if (noteId) {
            ui.showModal('Delete Note', 'Are you sure?', async () => {
                try {
                    ui.showLoading();
                    await data.deleteNote(noteId);
                    ui.hideLoading();
                    ui.showToast('Note deleted', 'success');
                    ui.showView('notes');
                    renderNotes();
                } catch (error) {
                    ui.hideLoading();
                    ui.showToast('Failed to delete note', 'error');
                }
            });
        }
    });

    colorOptions.forEach(option => {
        option.addEventListener('click', function handleColorOption(e) {
            e.preventDefault();
            colorOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedNoteColor = this.dataset.color;
            document.getElementById('note-color-input').value = selectedNoteColor;
        });
    });

    document.getElementById('note-title-input').addEventListener('input', function handleNoteTitleInput() {
        console.log('Note title:', this.value);
    });

    document.getElementById('note-content-input').addEventListener('input', function handleNoteContentInput() {
        validator.clearFieldError(this);
    });

    document.getElementById('note-pinned-input').addEventListener('change', function handleNotePinChange() {
        console.log('Pin status:', this.checked);
    });
}

function setupCalendarEvents() {
    const calPrev = document.getElementById('cal-prev');
    const calNext = document.getElementById('cal-next');

    calPrev.addEventListener('click', function handleCalPrev() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    calNext.addEventListener('click', function handleCalNext() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
}

function setupProfileEvents() {
    const profileForm = document.getElementById('profile-form');

    profileForm.addEventListener('submit', function handleProfileSubmit(e) {
        e.preventDefault();
        const username = document.getElementById('profile-username').value;
        const email = document.getElementById('profile-email').value;
        localStorage.setItem('userProfile', JSON.stringify({ username, email }));
        ui.showToast('Profile saved', 'success');
    });

    document.getElementById('profile-username').addEventListener('input', function handleUsernameInput() {
        validator.clearFieldError(this);
    });

    document.getElementById('profile-email').addEventListener('input', function handleEmailInput() {
        validator.clearFieldError(this);
    });

    document.getElementById('profile-email').addEventListener('blur', function handleEmailBlur() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
            validator.showFieldError(this, 'Invalid email format');
        }
    });
}

function setupSettingsEvents() {
    const themeToggle = document.getElementById('setting-theme');
    const notifToggle = document.getElementById('setting-notifications');
    const soundToggle = document.getElementById('setting-sound');
    const langSelect = document.getElementById('setting-language');
    const exportBtn = document.getElementById('export-data-btn');
    const clearBtn = document.getElementById('clear-data-btn');

    themeToggle.checked = ui.getTheme() === 'dark';

    themeToggle.addEventListener('change', function handleThemeToggle() {
        ui.setTheme(this.checked ? 'dark' : 'light');
        ui.showToast('Theme updated', 'success');
    });

    notifToggle.addEventListener('change', function handleNotifToggle() {
        localStorage.setItem('notifications', this.checked);
        ui.showToast('Notification settings updated', 'success');
    });

    soundToggle.addEventListener('change', function handleSoundToggle() {
        localStorage.setItem('sound', this.checked);
        console.log('Sound effects:', this.checked ? 'enabled' : 'disabled');
    });

    langSelect.addEventListener('change', function handleLangChange() {
        localStorage.setItem('language', this.value);
        ui.showToast('Language preference saved', 'success');
    });

    exportBtn.addEventListener('click', function handleExport() {
        const exportData = data.exportData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'taskflow-export.json';
        a.click();
        URL.revokeObjectURL(url);
        ui.showToast('Data exported', 'success');
    });

    clearBtn.addEventListener('click', function handleClear() {
        ui.showModal('Clear All Data', 'This will permanently delete all your data. Continue?', () => {
            localStorage.clear();
            ui.showToast('Data cleared', 'warning');
            location.reload();
        });
    });
}

function setupModalEvents() {
    const modalOverlay = document.getElementById('modal-overlay');

    modalOverlay.addEventListener('click', function handleOverlayClick(e) {
        if (e.target === modalOverlay) {
            ui.hideModal();
        }
    });

    document.addEventListener('keydown', function handleEscKey(e) {
        if (e.key === 'Escape') {
            ui.hideModal();
        }
    });
}

function setupDragAndDrop() {
    document.addEventListener('dragstart', function handleDragStart(e) {
        if (e.target.classList.contains('task-item')) {
            draggedTask = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    document.addEventListener('dragend', function handleDragEnd(e) {
        if (e.target.classList.contains('task-item')) {
            e.target.classList.remove('dragging');
            draggedTask = null;
        }
    });

    document.addEventListener('dragover', function handleDragOver(e) {
        e.preventDefault();
        const taskItem = e.target.closest('.task-item');
        if (taskItem && taskItem !== draggedTask) {
            taskItem.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', function handleDragLeave(e) {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', function handleDrop(e) {
        e.preventDefault();
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.classList.remove('drag-over');
        }
    });
}

function setupSearchAndFilters() {
    const taskSearch = document.getElementById('task-search');
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const noteSearch = document.getElementById('note-search');

    let searchTimeout;
    taskSearch.addEventListener('input', function handleTaskSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderTasks();
        }, 300);
    });

    taskSearch.addEventListener('focus', function handleSearchFocus() {
        this.parentElement.classList.add('focused');
    });

    taskSearch.addEventListener('blur', function handleSearchBlur() {
        this.parentElement.classList.remove('focused');
    });

    filterStatus.addEventListener('change', function handleStatusFilter() {
        renderTasks();
    });

    filterPriority.addEventListener('change', function handlePriorityFilter() {
        renderTasks();
    });

    let noteSearchTimeout;
    noteSearch.addEventListener('input', function handleNoteSearch() {
        clearTimeout(noteSearchTimeout);
        noteSearchTimeout = setTimeout(() => {
            const query = this.value.trim();
            if (query) {
                const filtered = data.searchNotes(query);
                renderNotesList(filtered);
            } else {
                renderNotes();
            }
        }, 300);
    });

    noteSearch.addEventListener('focus', function handleNoteSearchFocus() {
        this.classList.add('focused');
    });

    noteSearch.addEventListener('blur', function handleNoteSearchBlur() {
        this.classList.remove('focused');
    });
}

function setupQuickActions() {
    document.addEventListener('touchstart', function handleTouchStart(e) {
        console.log('Touch started');
    }, { passive: true });

    document.addEventListener('touchend', function handleTouchEnd(e) {
        console.log('Touch ended');
    }, { passive: true });

    window.addEventListener('scroll', function handleScroll() {
        const fab = document.querySelector('.fab');
        if (fab) {
            if (window.scrollY > 200) {
                fab.style.transform = 'scale(0.9)';
            } else {
                fab.style.transform = 'scale(1)';
            }
        }
    });

    window.addEventListener('resize', function handleResize() {
        console.log('Window resized');
    });

    window.addEventListener('online', function handleOnline() {
        ui.showToast('Back online', 'success');
    });

    window.addEventListener('offline', function handleOffline() {
        ui.showToast('You are offline', 'warning');
    });
}

async function loadInitialData() {
    ui.showLoading();
    try {
        await Promise.all([
            data.loadTasks(),
            data.loadCategories(),
            data.loadNotes(),
            data.loadStats()
        ]);
        renderDashboard();
        populateCategorySelect();
        loadSavedProfile();
        ui.hideLoading();
    } catch (error) {
        ui.hideLoading();
        ui.showToast('Failed to load data', 'error');
        console.error('Load error:', error);
    }
}

function loadViewData(viewName) {
    switch (viewName) {
        case 'dashboard':
            data.loadStats().then(renderDashboard);
            break;
        case 'tasks':
            data.loadTasks().then(renderTasks);
            break;
        case 'categories':
            data.loadCategories().then(renderCategories);
            break;
        case 'notes':
            data.loadNotes().then(renderNotes);
            break;
        case 'calendar':
            renderCalendar();
            break;
    }
}

function renderDashboard() {
    const stats = data.getStats();
    if (stats) {
        document.getElementById('stat-total-value').textContent = stats.tasks.total;
        document.getElementById('stat-pending-value').textContent = stats.tasks.pending;
        document.getElementById('stat-progress-value').textContent = stats.tasks.inProgress;
        document.getElementById('stat-completed-value').textContent = stats.tasks.completed;
    }

    const recentTasks = data.getTasks().slice(0, 5);
    const recentList = document.getElementById('recent-tasks-list');
    
    if (recentTasks.length === 0) {
        ui.renderEmptyState(recentList, '📋', 'No tasks yet', 'Create Task', () => {
            ui.showView('task-form');
            openTaskForm();
        });
    } else {
        renderTasksList(recentTasks, recentList);
    }
}

function renderTasks() {
    const filters = {
        status: document.getElementById('filter-status').value,
        priority: document.getElementById('filter-priority').value,
        search: document.getElementById('task-search').value
    };
    
    const tasks = data.filterTasks(filters);
    const tasksList = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
        ui.renderEmptyState(tasksList, '📋', 'No tasks found', 'Create Task', () => {
            openTaskForm();
        });
    } else {
        renderTasksList(tasks, tasksList);
    }
}

function renderTasksList(tasks, container) {
    container.innerHTML = tasks.map(task => `
        <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}" 
             data-id="${task._id || task.id}" draggable="true">
            <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                 data-id="${task._id || task.id}"></div>
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="badge badge-${task.priority}">${task.priority}</span>
                    ${task.dueDate ? `<span>${ui.formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', function handleTaskClick(e) {
            if (!e.target.classList.contains('task-checkbox')) {
                const id = this.dataset.id;
                openTaskForm(id);
            }
        });

        item.addEventListener('dblclick', function handleTaskDblClick() {
            const id = this.dataset.id;
            const task = data.getTaskById(id);
            if (task) {
                ui.showToast(`Task: ${task.title}`, 'info');
            }
        });

        item.addEventListener('mouseenter', function handleTaskMouseEnter() {
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        });

        item.addEventListener('mouseleave', function handleTaskMouseLeave() {
            this.style.boxShadow = '';
        });
    });

    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', async function handleCheckboxClick(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const task = data.getTaskById(id);
            if (task) {
                const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                try {
                    await data.updateTask(id, { status: newStatus });
                    renderTasks();
                    data.loadStats().then(renderDashboard);
                    ui.showToast(newStatus === 'completed' ? 'Task completed!' : 'Task reopened', 'success');
                } catch (error) {
                    ui.showToast('Failed to update task', 'error');
                }
            }
        });
    });
}

function renderCategories() {
    const categories = data.getCategories();
    const categoriesList = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        ui.renderEmptyState(categoriesList, '📁', 'No categories yet', 'Create Category', () => {
            openCategoryForm();
        });
    } else {
        categoriesList.innerHTML = categories.map(cat => `
            <div class="category-card" data-id="${cat._id || cat.id}" style="border-top-color: ${cat.color}">
                <div class="category-icon">${ui.getIconForCategory(cat.icon)}</div>
                <div class="category-name">${escapeHtml(cat.name)}</div>
            </div>
        `).join('');

        categoriesList.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', function handleCategoryClick() {
                const id = this.dataset.id;
                openCategoryForm(id);
            });

            card.addEventListener('mouseenter', function handleCategoryMouseEnter() {
                this.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', function handleCategoryMouseLeave() {
                this.style.transform = '';
            });
        });
    }
}

function renderNotes() {
    const notes = data.getNotes();
    renderNotesList(notes);
}

function renderNotesList(notes) {
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
        ui.renderEmptyState(notesList, '📝', 'No notes yet', 'Create Note', () => {
            openNoteForm();
        });
    } else {
        notesList.innerHTML = notes.map(note => `
            <div class="note-card ${note.pinned ? 'pinned' : ''}" data-id="${note._id || note.id}" 
                 style="background-color: ${note.color}">
                ${note.pinned ? '<span class="note-pin">📌</span>' : ''}
                ${note.title ? `<div class="note-title">${escapeHtml(note.title)}</div>` : ''}
                <div class="note-content">${escapeHtml(note.content)}</div>
            </div>
        `).join('');

        notesList.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', function handleNoteClick() {
                const id = this.dataset.id;
                openNoteForm(id);
            });

            card.addEventListener('mouseenter', function handleNoteMouseEnter() {
                this.style.transform = 'scale(1.03)';
            });

            card.addEventListener('mouseleave', function handleNoteMouseLeave() {
                this.style.transform = '';
            });
        });
    }
}

function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendar-month').textContent = 
        `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    const taskDates = data.getTaskDates();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    const prevMonthDays = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthDays - i;
        calendarDays.appendChild(day);
    }
    
    for (let i = 1; i <= totalDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;
        
        const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        if (today.getDate() === i && 
            today.getMonth() === currentCalendarDate.getMonth() && 
            today.getFullYear() === currentCalendarDate.getFullYear()) {
            day.classList.add('today');
        }
        
        if (taskDates.has(dateStr)) {
            day.classList.add('has-tasks');
        }
        
        day.addEventListener('click', function handleDayClick() {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            showTasksForDate(dateStr);
        });
        
        calendarDays.appendChild(day);
    }
    
    const remainingDays = 42 - (startingDay + totalDays);
    for (let i = 1; i <= remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        calendarDays.appendChild(day);
    }
}

function showTasksForDate(dateStr) {
    const tasks = data.getTasksByDate(dateStr);
    const container = document.getElementById('calendar-task-list');
    const title = document.getElementById('selected-date-title');
    
    const date = new Date(dateStr);
    title.textContent = `Tasks for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:1rem;">No tasks for this date</p>';
    } else {
        renderTasksList(tasks, container);
    }
}

function openTaskForm(taskId = null) {
    ui.showView('task-form');
    const form = document.getElementById('task-form');
    const deleteBtn = document.getElementById('task-delete-btn');
    const formTitle = document.getElementById('task-form-title');
    
    form.reset();
    document.getElementById('task-id').value = '';
    deleteBtn.classList.add('hidden');
    formTitle.textContent = 'New Task';
    
    if (taskId) {
        const task = data.getTaskById(taskId);
        if (task) {
            formTitle.textContent = 'Edit Task';
            document.getElementById('task-id').value = taskId;
            document.getElementById('task-title-input').value = task.title;
            document.getElementById('task-description-input').value = task.description || '';
            document.getElementById('task-category-input').value = task.category || 'general';
            document.getElementById('task-priority-input').value = task.priority || 'medium';
            document.getElementById('task-status-input').value = task.status || 'pending';
            if (task.dueDate) {
                document.getElementById('task-due-date-input').value = task.dueDate.split('T')[0];
            }
            deleteBtn.classList.remove('hidden');
        }
    }
}

async function saveTask() {
    const taskId = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title-input').value.trim(),
        description: document.getElementById('task-description-input').value.trim(),
        category: document.getElementById('task-category-input').value,
        priority: document.getElementById('task-priority-input').value,
        status: document.getElementById('task-status-input').value,
        dueDate: document.getElementById('task-due-date-input').value || null
    };
    
    if (!taskData.title) {
        validator.showFieldError(document.getElementById('task-title-input'), 'Title is required');
        return;
    }
    
    try {
        ui.showLoading();
        if (taskId) {
            await data.updateTask(taskId, taskData);
            ui.showToast('Task updated', 'success');
        } else {
            await data.createTask(taskData);
            ui.showToast('Task created', 'success');
        }
        ui.hideLoading();
        ui.showView('tasks');
        renderTasks();
        data.loadStats().then(renderDashboard);
    } catch (error) {
        ui.hideLoading();
        ui.showToast('Failed to save task', 'error');
    }
}

function openCategoryForm(categoryId = null) {
    ui.showView('category-form');
    const form = document.getElementById('category-form');
    const deleteBtn = document.getElementById('category-delete-btn');
    const formTitle = document.getElementById('category-form-title');
    
    form.reset();
    document.getElementById('category-id').value = '';
    deleteBtn.classList.add('hidden');
    formTitle.textContent = 'New Category';
    
    if (categoryId) {
        const category = data.getCategoryById(categoryId);
        if (category) {
            formTitle.textContent = 'Edit Category';
            document.getElementById('category-id').value = categoryId;
            document.getElementById('category-name-input').value = category.name;
            document.getElementById('category-color-input').value = category.color || '#3498db';
            document.getElementById('category-icon-input').value = category.icon || 'folder';
            deleteBtn.classList.remove('hidden');
        }
    }
}

async function saveCategory() {
    const categoryId = document.getElementById('category-id').value;
    const categoryData = {
        name: document.getElementById('category-name-input').value.trim(),
        color: document.getElementById('category-color-input').value,
        icon: document.getElementById('category-icon-input').value
    };
    
    if (!categoryData.name) {
        validator.showFieldError(document.getElementById('category-name-input'), 'Name is required');
        return;
    }
    
    try {
        ui.showLoading();
        if (categoryId) {
            await data.updateCategory(categoryId, categoryData);
            ui.showToast('Category updated', 'success');
        } else {
            await data.createCategory(categoryData);
            ui.showToast('Category created', 'success');
        }
        ui.hideLoading();
        ui.showView('categories');
        renderCategories();
        populateCategorySelect();
    } catch (error) {
        ui.hideLoading();
        ui.showToast('Failed to save category', 'error');
    }
}

function openNoteForm(noteId = null) {
    ui.showView('note-form');
    const form = document.getElementById('note-form');
    const deleteBtn = document.getElementById('note-delete-btn');
    const formTitle = document.getElementById('note-form-title');
    
    form.reset();
    document.getElementById('note-id').value = '';
    deleteBtn.classList.add('hidden');
    formTitle.textContent = 'New Note';
    selectedNoteColor = '#ffffa5';
    document.getElementById('note-color-input').value = selectedNoteColor;
    
    document.querySelectorAll('.color-option').forEach(o => {
        o.classList.remove('selected');
        if (o.dataset.color === selectedNoteColor) {
            o.classList.add('selected');
        }
    });
    
    if (noteId) {
        const note = data.getNoteById(noteId);
        if (note) {
            formTitle.textContent = 'Edit Note';
            document.getElementById('note-id').value = noteId;
            document.getElementById('note-title-input').value = note.title || '';
            document.getElementById('note-content-input').value = note.content;
            document.getElementById('note-pinned-input').checked = note.pinned || false;
            selectedNoteColor = note.color || '#ffffa5';
            document.getElementById('note-color-input').value = selectedNoteColor;
            
            document.querySelectorAll('.color-option').forEach(o => {
                o.classList.remove('selected');
                if (o.dataset.color === selectedNoteColor) {
                    o.classList.add('selected');
                }
            });
            
            deleteBtn.classList.remove('hidden');
        }
    }
}

async function saveNote() {
    const noteId = document.getElementById('note-id').value;
    const noteData = {
        title: document.getElementById('note-title-input').value.trim(),
        content: document.getElementById('note-content-input').value.trim(),
        color: document.getElementById('note-color-input').value,
        pinned: document.getElementById('note-pinned-input').checked
    };
    
    if (!noteData.content) {
        validator.showFieldError(document.getElementById('note-content-input'), 'Content is required');
        return;
    }
    
    try {
        ui.showLoading();
        if (noteId) {
            await data.updateNote(noteId, noteData);
            ui.showToast('Note updated', 'success');
        } else {
            await data.createNote(noteData);
            ui.showToast('Note created', 'success');
        }
        ui.hideLoading();
        ui.showView('notes');
        renderNotes();
    } catch (error) {
        ui.hideLoading();
        ui.showToast('Failed to save note', 'error');
    }
}

function populateCategorySelect() {
    const select = document.getElementById('task-category-input');
    const categories = data.getCategories();
    
    select.innerHTML = '<option value="general">General</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
}

function loadSavedProfile() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
        const { username, email } = JSON.parse(saved);
        document.getElementById('profile-username').value = username || '';
        document.getElementById('profile-email').value = email || '';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

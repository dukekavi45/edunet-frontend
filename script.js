// Task Manager JavaScript Implementation
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateProgress();
    }

    bindEvents() {
        // Task input events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Action button events
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // Modal events
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmAction());

        // Close modal on backdrop click
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideModal();
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const text = taskInput.value.trim();

        if (!text) {
            this.shakeElement(taskInput);
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateProgress();

        // Clear input with animation
        taskInput.value = '';
        taskInput.focus();
        
        // Add success animation
        this.animateAddition();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateProgress();
            
            // Add completion animation
            if (task.completed) {
                this.animateCompletion(id);
            }
        }
    }

    deleteTask(id) {
        this.showConfirmModal('Are you sure you want to delete this task?', () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.updateProgress();
            this.animateDeletion();
        });
    }

    editTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        const textElement = taskElement.querySelector('.task-text');
        const editInput = taskElement.querySelector('.task-edit-input');
        
        if (editInput.classList.contains('active')) {
            // Save edit
            const newText = editInput.value.trim();
            if (newText) {
                const task = this.tasks.find(t => t.id === id);
                task.text = newText;
                this.saveTasks();
            }
            this.exitEditMode(taskElement);
        } else {
            // Enter edit mode
            this.enterEditMode(taskElement, textElement.textContent);
        }
        
        this.render();
    }

    enterEditMode(taskElement, currentText) {
        const textElement = taskElement.querySelector('.task-text');
        const editInput = taskElement.querySelector('.task-edit-input');
        
        textElement.classList.add('editing');
        editInput.classList.add('active');
        editInput.value = currentText;
        editInput.focus();
        editInput.select();

        // Handle escape and enter keys
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                this.exitEditMode(taskElement);
                this.render();
            } else if (e.key === 'Enter') {
                const taskId = parseInt(taskElement.dataset.taskId);
                this.editTask(taskId);
            }
        };

        editInput.addEventListener('keydown', handleKeyPress);
        editInput.addEventListener('blur', () => {
            const taskId = parseInt(taskElement.dataset.taskId);
            this.editTask(taskId);
        });
    }

    exitEditMode(taskElement) {
        const textElement = taskElement.querySelector('.task-text');
        const editInput = taskElement.querySelector('.task-edit-input');
        
        textElement.classList.remove('editing');
        editInput.classList.remove('active');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    clearCompleted() {
        const completedTasks = this.tasks.filter(t => t.completed);
        if (completedTasks.length === 0) {
            this.showToast('No completed tasks to clear');
            return;
        }

        this.showConfirmModal(`Are you sure you want to delete ${completedTasks.length} completed task${completedTasks.length > 1 ? 's' : ''}?`, () => {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.updateProgress();
            this.showToast('Completed tasks cleared');
        });
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showToast('No tasks to clear');
            return;
        }

        this.showConfirmModal(`Are you sure you want to delete all ${this.tasks.length} task${this.tasks.length > 1 ? 's' : ''}?`, () => {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.updateProgress();
            this.showToast('All tasks cleared');
        });
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            emptyState.style.display = 'block';
            
            // Update empty state message based on filter
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            
            switch (this.currentFilter) {
                case 'active':
                    emptyTitle.textContent = 'No active tasks';
                    emptyText.textContent = 'All your tasks are completed! 🎉';
                    break;
                case 'completed':
                    emptyTitle.textContent = 'No completed tasks';
                    emptyText.textContent = 'Complete some tasks to see them here.';
                    break;
                default:
                    emptyTitle.textContent = 'No tasks yet';
                    emptyText.textContent = 'Add a task above to get started with your productivity journey!';
            }
        } else {
            emptyState.style.display = 'none';
            tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
        }

        this.updateStats();
    }

    renderTask(task) {
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        
        return `
            <div class="task-item ${priorityClass} ${completedClass}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTask(${task.id})"></div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                    <input type="text" class="task-edit-input" value="${task.text}">
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit" onclick="taskManager.editTask(${task.id})" title="Edit task">✏️</button>
                    <button class="task-btn delete" onclick="taskManager.deleteTask(${task.id})" title="Delete task">🗑️</button>
                </div>
            </div>
        `;
    }

    updateProgress() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-percentage');
        
        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}%`;

        // Add milestone celebrations
        if (progressPercentage === 100 && totalTasks > 0) {
            this.celebrateCompletion();
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const activeTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('activeTasks').textContent = activeTasks;

        // Animate stat changes
        this.animateStats();
    }

    // Animation methods
    animateAddition() {
        const addBtn = document.getElementById('addTaskBtn');
        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addBtn.style.transform = 'scale(1)';
        }, 150);
    }

    animateCompletion(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                taskElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    animateDeletion() {
        // Trigger a subtle shake animation on the tasks list
        const tasksList = document.getElementById('tasksList');
        tasksList.style.animation = 'none';
        setTimeout(() => {
            tasksList.style.animation = 'fadeInUp 0.3s ease-out';
        }, 10);
    }

    animateStats() {
        document.querySelectorAll('.stat-number').forEach(stat => {
            stat.style.transform = 'scale(1.1)';
            setTimeout(() => {
                stat.style.transform = 'scale(1)';
            }, 200);
        });
    }

    celebrateCompletion() {
        // Show celebration message
        this.showToast('🎉 Congratulations! All tasks completed!', 3000);
        
        // Add celebration effect
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.animation = 'pulse 1s ease-in-out 3';
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    // Modal methods
    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        
        messageElement.textContent = message;
        modal.classList.add('active');
        
        this.pendingAction = onConfirm;
    }

    hideModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('active');
        this.pendingAction = null;
    }

    confirmAction() {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = null;
        }
        this.hideModal();
    }

    // Toast notification method
    showToast(message, duration = 2000) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--primary-gradient);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius-small);
                box-shadow: var(--shadow-medium);
                z-index: 1001;
                transform: translateX(100%);
                transition: transform 0.3s ease-out;
                max-width: 300px;
                font-weight: 500;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        
        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Hide toast
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
        }, duration);
    }

    // localStorage methods
    saveTasks() {
        try {
            localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showToast('Failed to save tasks');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('taskManagerTasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            return [];
        }
    }
}

// Add shake animation to CSS dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(shakeStyle);

// Initialize the task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('addTaskBtn').click();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('confirmModal');
        if (modal.classList.contains('active')) {
            window.taskManager.hideModal();
        }
    }
});
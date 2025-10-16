// Sora Video Generator Frontend
class SoraVideoGenerator {
    constructor() {
        this.tasks = [];
        this.ws = null;
        this.isBatchMode = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadTasks();
        this.updateStats();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('generation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSingleTask();
        });

        // Batch mode toggle
        document.getElementById('batch-mode-btn').addEventListener('click', () => {
            this.toggleBatchMode();
        });

        // Batch generation
        document.getElementById('generate-batch').addEventListener('click', () => {
            this.createBatchTasks();
        });

        // Cancel batch
        document.getElementById('cancel-batch').addEventListener('click', () => {
            this.toggleBatchMode();
        });

        // Add prompt button
        document.getElementById('add-prompt-btn').addEventListener('click', () => {
            this.addPromptInput();
        });

        // Character count
        document.getElementById('prompt').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        // Refresh tasks
        document.getElementById('refresh-tasks').addEventListener('click', () => {
            this.loadTasks();
        });

        // Clear completed
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeModal();
            }
        });
    }

    connectWebSocket() {
        // WebSocket disabled for Vercel compatibility
        // Use polling instead
        console.log('Using polling for updates (WebSocket disabled)');
        this.startPolling();
    }

    startPolling() {
        // Poll for updates every 2 seconds
        setInterval(() => {
            this.loadTasks();
        }, 2000);
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'initial_data':
                this.tasks = data.tasks || [];
                this.renderTasks();
                this.updateStats();
                break;
            case 'task_created':
                this.tasks.unshift(data.task);
                this.renderTasks();
                this.updateStats();
                this.showToast('Task created successfully!', 'success');
                break;
            case 'task_update':
                this.updateTaskInList(data.task);
                this.renderTasks();
                this.updateStats();
                break;
            case 'task_completed':
                this.updateTaskInList(data.task);
                this.renderTasks();
                this.updateStats();
                this.showToast('Video generation completed!', 'success');
                break;
        }
    }

    updateTaskInList(updatedTask) {
        const index = this.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = updatedTask;
        }
    }

    async createSingleTask() {
        const prompt = document.getElementById('prompt').value.trim();
        const aspectRatio = document.getElementById('aspect-ratio').value;
        const removeWatermark = document.getElementById('remove-watermark').checked;

        if (!prompt) {
            this.showToast('Please enter a prompt', 'error');
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    options: {
                        aspectRatio,
                        removeWatermark
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create task');
            }

            const result = await response.json();
            document.getElementById('prompt').value = '';
            this.updateCharCount(0);
            
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async createBatchTasks() {
        const promptInputs = document.querySelectorAll('#prompt-container textarea');
        const prompts = Array.from(promptInputs)
            .map(input => input.value.trim())
            .filter(prompt => prompt.length > 0);

        if (prompts.length === 0) {
            this.showToast('Please enter at least one prompt', 'error');
            return;
        }

        const aspectRatio = document.getElementById('aspect-ratio').value;
        const removeWatermark = document.getElementById('remove-watermark').checked;

        try {
            const response = await fetch('/api/tasks/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompts,
                    options: {
                        aspectRatio,
                        removeWatermark
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create batch tasks');
            }

            this.clearAllPrompts();
            this.toggleBatchMode();
            this.showToast(`Created ${prompts.length} tasks successfully!`, 'success');
            
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    toggleBatchMode() {
        this.isBatchMode = !this.isBatchMode;
        const batchForm = document.getElementById('batch-form');
        const batchBtn = document.getElementById('batch-mode-btn');
        
        if (this.isBatchMode) {
            batchForm.style.display = 'block';
            batchBtn.textContent = 'Single Mode';
            batchBtn.innerHTML = '<i class="fas fa-user"></i> Single Mode';
            this.addPromptInput(); // Add first prompt input
        } else {
            batchForm.style.display = 'none';
            batchBtn.textContent = 'Batch Mode';
            batchBtn.innerHTML = '<i class="fas fa-layer-group"></i> Batch Mode';
            this.clearAllPrompts();
        }
    }

    addPromptInput() {
        const promptContainer = document.getElementById('prompt-container');
        const promptCount = document.getElementById('prompt-count');
        const promptCounter = promptContainer.children.length + 1;
        const promptId = `prompt-${promptCounter}`;
        
        const promptGroup = document.createElement('div');
        promptGroup.className = 'prompt-input-group';
        promptGroup.innerHTML = `
            <div class="form-group">
                <label for="${promptId}">
                    Prompt ${promptCounter}
                    <button type="button" class="remove-prompt-btn" data-prompt-id="${promptId}">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </label>
                <textarea 
                    id="${promptId}" 
                    name="prompts[]" 
                    placeholder="Describe the video you want to generate...&#10;&#10;Example:&#10;A cinematic shot of a cat sitting on a windowsill,&#10;looking out at a rainy day. The camera slowly zooms in&#10;on the cat's eyes as raindrops hit the window."
                    rows="4"
                ></textarea>
            </div>
        `;
        
        promptContainer.appendChild(promptGroup);
        this.updatePromptCount();
        
        // Add remove button event listener
        const removeBtn = promptGroup.querySelector('.remove-prompt-btn');
        removeBtn.addEventListener('click', () => {
            promptGroup.remove();
            this.updatePromptCount();
        });
    }

    updatePromptCount() {
        const promptContainer = document.getElementById('prompt-container');
        const promptCount = document.getElementById('prompt-count');
        const count = promptContainer.children.length;
        promptCount.textContent = `${count} prompt${count !== 1 ? 's' : ''}`;
    }

    clearAllPrompts() {
        const promptContainer = document.getElementById('prompt-container');
        promptContainer.innerHTML = '';
        this.updatePromptCount();
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const data = await response.json();
                this.tasks = data.tasks || [];
                this.renderTasks();
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    async clearCompletedTasks() {
        const completedTasks = this.tasks.filter(task => task.status === 'completed');
        
        if (completedTasks.length === 0) {
            this.showToast('No completed tasks to clear', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to clear ${completedTasks.length} completed tasks?`)) {
            // In a real implementation, you'd call an API endpoint to clear tasks
            // For now, we'll just filter them out from the local list
            this.tasks = this.tasks.filter(task => task.status !== 'completed');
            this.renderTasks();
            this.updateStats();
            this.showToast('Completed tasks cleared', 'success');
        }
    }

    async cancelTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('Task cancelled', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel task');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');

        if (this.tasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tasksList.style.display = 'block';
        emptyState.style.display = 'none';

        tasksList.innerHTML = this.tasks.map(task => this.createTaskHTML(task)).join('');
    }

    createTaskHTML(task) {
        const statusClass = task.status.toLowerCase();
        const progress = task.progress || 0;
        const createdAt = new Date(task.createdAt).toLocaleString();
        
        let resultHTML = '';
        if (task.status === 'completed' && task.result && task.result.urls) {
            resultHTML = `
                <div class="task-result">
                    <h4>Generated Video:</h4>
                    <div class="task-result-video">
                        ${task.result.urls.map(url => `
                            <div class="video-preview">
                                <video controls preload="metadata" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px;">
                                    <source src="${url}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <div class="video-actions">
                                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">
                                        <i class="fas fa-external-link-alt"></i> Open Full Size
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let actionsHTML = '';
        if (task.status === 'processing' || task.status === 'generating') {
            actionsHTML = `
                <button class="btn btn-sm" onclick="app.cancelTask('${task.id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
        }

        return `
            <div class="task-item" onclick="app.showTaskDetails('${task.id}')">
                <div class="task-header">
                    <div class="task-status ${statusClass}">${task.status}</div>
                    ${actionsHTML}
                </div>
                
                <div class="task-prompt">${this.escapeHtml(task.prompt)}</div>
                
                <div class="task-progress">
                    <div class="task-progress-bar" style="width: ${progress}%"></div>
                </div>
                
                <div class="task-meta">
                    <span>Created: ${createdAt}</span>
                    <span>Progress: ${progress}%</span>
                </div>
                
                ${resultHTML}
            </div>
        `;
    }

    showTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('task-modal');
        const details = document.getElementById('task-details');
        
        const createdAt = new Date(task.createdAt).toLocaleString();
        const updatedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A';
        
        let resultHTML = '';
        if (task.result) {
            if (task.result.urls && task.result.urls.length > 0) {
                resultHTML = `
                    <h4>Generated Videos:</h4>
                    <div class="modal-videos">
                        ${task.result.urls.map(url => `
                            <div class="modal-video-item">
                                <video controls preload="metadata" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px;">
                                    <source src="${url}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <div class="video-actions">
                                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                                        <i class="fas fa-external-link-alt"></i> Open Full Size
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (task.result.consumeCredits) {
                resultHTML += `
                    <div style="margin-top: 1rem; padding: 1rem; background: #f7fafc; border-radius: 8px;">
                        <h4>Generation Details:</h4>
                        <p><strong>Credits Used:</strong> ${task.result.consumeCredits}</p>
                        <p><strong>Processing Time:</strong> ${task.result.costTime}s</p>
                        <p><strong>Remaining Credits:</strong> ${task.result.remainedCredits}</p>
                    </div>
                `;
            }
        }

        details.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4>Prompt:</h4>
                <p style="background: #f7fafc; padding: 1rem; border-radius: 8px; white-space: pre-wrap;">${this.escapeHtml(task.prompt)}</p>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <h4>Settings:</h4>
                <p><strong>Aspect Ratio:</strong> ${task.options.aspectRatio || 'landscape'}</p>
                <p><strong>Remove Watermark:</strong> ${task.options.removeWatermark !== false ? 'Yes' : 'No'}</p>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <h4>Status:</h4>
                <p><strong>Status:</strong> <span class="task-status ${task.status.toLowerCase()}">${task.status}</span></p>
                <p><strong>Progress:</strong> ${task.progress || 0}%</p>
                <p><strong>Created:</strong> ${createdAt}</p>
                <p><strong>Updated:</strong> ${updatedAt}</p>
                ${task.kieTaskId ? `<p><strong>Kie Task ID:</strong> ${task.kieTaskId}</p>` : ''}
            </div>
            
            ${task.error ? `
                <div style="margin-bottom: 1rem; padding: 1rem; background: #fed7d7; border-radius: 8px;">
                    <h4>Error:</h4>
                    <p style="color: #e53e3e;">${this.escapeHtml(task.error)}</p>
                </div>
            ` : ''}
            
            ${resultHTML}
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('task-modal').classList.remove('show');
    }

    updateStats() {
        const activeCount = this.tasks.filter(task => 
            ['pending', 'processing', 'generating'].includes(task.status)
        ).length;
        
        const completedCount = this.tasks.filter(task => 
            task.status === 'completed'
        ).length;

        document.getElementById('active-count').textContent = activeCount;
        document.getElementById('completed-count').textContent = completedCount;
    }

    updateCharCount(count) {
        document.getElementById('char-count').textContent = count;
        
        const charCountElement = document.getElementById('char-count');
        if (count > 4500) {
            charCountElement.style.color = '#e53e3e';
        } else if (count > 4000) {
            charCountElement.style.color = '#d69e2e';
        } else {
            charCountElement.style.color = '#718096';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SoraVideoGenerator();
});
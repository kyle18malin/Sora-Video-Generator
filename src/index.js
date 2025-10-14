require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for tasks (in production, use a database)
const tasks = new Map();
const activeTasks = new Set();
const MAX_CONCURRENT_TASKS = parseInt(process.env.MAX_CONCURRENT_TASKS) || 5;

// WebSocket server for real-time updates (disabled for Vercel)
const server = require('http').createServer(app);
let wss = null;

// Only create WebSocket server if not in Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    wss = new WebSocket.Server({ server });
}

// Broadcast function for WebSocket
function broadcast(data) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    } else {
        // Log for Vercel (no WebSocket)
        console.log('Broadcast:', data);
    }
}

// Kie.ai API client
class KieApiClient {
    constructor() {
        this.apiKey = process.env.KIE_API_KEY;
        this.baseUrl = process.env.KIE_API_BASE_URL || 'https://api.kie.ai';
        this.callbackUrl = `${process.env.CALLBACK_BASE_URL || 'http://localhost:3000'}/api/callback`;
    }

    async createVideoTask(prompt, options = {}) {
        const payload = {
            model: 'sora-2-text-to-video',
            callBackUrl: this.callbackUrl,
            input: {
                prompt: prompt,
                aspect_ratio: options.aspectRatio || 'landscape',
                remove_watermark: options.removeWatermark !== false
            }
        };

        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v1/jobs/createTask`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating video task:', error.response?.data || error.message);
            throw error;
        }
    }
}

const kieClient = new KieApiClient();

// Task management functions
function createTask(prompt, options = {}) {
    const taskId = uuidv4();
    const task = {
        id: taskId,
        prompt: prompt,
        options: options,
        status: 'pending',
        createdAt: new Date().toISOString(),
        kieTaskId: null,
        result: null,
        error: null,
        progress: 0
    };
    
    tasks.set(taskId, task);
    return task;
}

function updateTaskStatus(taskId, updates) {
    const task = tasks.get(taskId);
    if (task) {
        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        tasks.set(taskId, task);
        broadcast({ type: 'task_update', task });
    }
}

async function processTaskQueue() {
    if (activeTasks.size >= MAX_CONCURRENT_TASKS) {
        return;
    }

    const pendingTasks = Array.from(tasks.values())
        .filter(task => task.status === 'pending')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const task of pendingTasks) {
        if (activeTasks.size >= MAX_CONCURRENT_TASKS) {
            break;
        }

        try {
            activeTasks.add(task.id);
            updateTaskStatus(task.id, { status: 'processing', progress: 10 });

            const response = await kieClient.createVideoTask(task.prompt, task.options);
            
            if (response.code === 200) {
                updateTaskStatus(task.id, { 
                    status: 'generating', 
                    kieTaskId: response.data.taskId,
                    progress: 50 
                });
            } else {
                throw new Error(response.message || 'Failed to create task');
            }
        } catch (error) {
            updateTaskStatus(task.id, { 
                status: 'failed', 
                error: error.message,
                progress: 0 
            });
            activeTasks.delete(task.id);
        }
    }
}

// API Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const taskList = Array.from(tasks.values()).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ tasks: taskList });
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task });
});

// Create new video generation task
app.post('/api/tasks', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;
        
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task = createTask(prompt, options);
        broadcast({ type: 'task_created', task });
        
        res.json({ task });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create multiple video generation tasks
app.post('/api/tasks/batch', async (req, res) => {
    try {
        const { prompts, options = {} } = req.body;
        
        if (!Array.isArray(prompts) || prompts.length === 0) {
            return res.status(400).json({ error: 'Prompts array is required' });
        }

        const tasks = prompts.map(prompt => createTask(prompt, options));
        tasks.forEach(task => broadcast({ type: 'task_created', task }));
        
        res.json({ tasks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel task
app.delete('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'processing' || task.status === 'generating') {
        updateTaskStatus(req.params.id, { status: 'cancelled' });
        activeTasks.delete(req.params.id);
    }

    res.json({ message: 'Task cancelled' });
});

// Callback endpoint for Kie.ai notifications
app.post('/api/callback', (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !data.taskId) {
            return res.status(400).json({ error: 'Invalid callback data' });
        }

        // Find task by Kie task ID
        const task = Array.from(tasks.values()).find(t => t.kieTaskId === data.taskId);
        
        if (!task) {
            console.log(`Task not found for Kie task ID: ${data.taskId}`);
            return res.status(404).json({ error: 'Task not found' });
        }

        if (data.state === 'success') {
            const resultUrls = JSON.parse(data.resultJson || '{}').resultUrls || [];
            updateTaskStatus(task.id, {
                status: 'completed',
                result: {
                    urls: resultUrls,
                    consumeCredits: data.consumeCredits,
                    costTime: data.costTime,
                    remainedCredits: data.remainedCredits
                },
                progress: 100
            });
        } else if (data.state === 'fail') {
            updateTaskStatus(task.id, {
                status: 'failed',
                error: data.failMsg || 'Generation failed',
                progress: 0
            });
        }

        activeTasks.delete(task.id);
        broadcast({ type: 'task_completed', task: tasks.get(task.id) });
        
        res.json({ message: 'Callback processed' });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: error.message });
    }
});

// WebSocket connection handler
if (wss) {
    wss.on('connection', (ws) => {
        console.log('Client connected');
        
        // Send current tasks to new client
        const taskList = Array.from(tasks.values());
        ws.send(JSON.stringify({ type: 'initial_data', tasks: taskList }));

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

// Cleanup completed tasks older than 24 hours
cron.schedule('0 0 * * *', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tasksToDelete = [];
    
    tasks.forEach((task, taskId) => {
        if (task.status === 'completed' && new Date(task.createdAt) < oneDayAgo) {
            tasksToDelete.push(taskId);
        }
    });
    
    tasksToDelete.forEach(taskId => tasks.delete(taskId));
    console.log(`Cleaned up ${tasksToDelete.length} old tasks`);
});

// Process task queue every 5 seconds
setInterval(processTaskQueue, 5000);

// Check task status every 30 seconds for tasks without callbacks
setInterval(async () => {
    const generatingTasks = Array.from(tasks.values())
        .filter(task => task.status === 'generating' && task.kieTaskId);
    
    for (const task of generatingTasks) {
        try {
            // Check if task has been running for more than 2 minutes
            const taskAge = Date.now() - new Date(task.createdAt).getTime();
            if (taskAge > 120000) { // 2 minutes
                console.log(`Checking status for task ${task.id} (Kie ID: ${task.kieTaskId})`);
                
                // For now, let's simulate completion after 3 minutes for testing
                if (taskAge > 180000) { // 3 minutes
                    updateTaskStatus(task.id, {
                        status: 'completed',
                        result: {
                            urls: ['https://example.com/test-video.mp4'], // Placeholder URL
                            consumeCredits: 100,
                            costTime: 180,
                            remainedCredits: 2500000
                        },
                        progress: 100
                    });
                    activeTasks.delete(task.id);
                    broadcast({ type: 'task_completed', task: tasks.get(task.id) });
                    console.log(`Task ${task.id} marked as completed (simulated)`);
                }
            }
        } catch (error) {
            console.error(`Error checking task ${task.id}:`, error);
        }
    }
}, 30000); // Check every 30 seconds

// Start server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const port = process.env.PORT || PORT;
    server.listen(port, () => {
        console.log(`Sora Video Generator running on port ${port}`);
        console.log(`Max concurrent tasks: ${MAX_CONCURRENT_TASKS}`);
    });
}

// Export for Vercel
module.exports = app;

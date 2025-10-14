// Vercel API route for tasks
export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Return empty tasks array for now
        // In production, you'd fetch from a database
        return res.json({ tasks: [] });
    }

    if (req.method === 'POST') {
        // Handle task creation
        const { prompt, aspect_ratio, remove_watermark, batch_mode, batch_prompts } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Generate a task ID
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create task object
        const task = {
            id: taskId,
            prompt,
            aspect_ratio: aspect_ratio || 'landscape',
            remove_watermark: remove_watermark || false,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // For now, just return the task
        // In production, you'd save to database and call Kie.ai API
        return res.json({ 
            message: 'Task created successfully',
            task 
        });
    }

    res.status(405).json({ error: 'Method not allowed' });
}

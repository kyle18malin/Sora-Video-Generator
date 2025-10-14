// Vercel API route for Kie.ai callbacks
export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data } = req.body;
        
        if (!data || !data.taskId) {
            return res.status(400).json({ error: 'Invalid callback data' });
        }

        // Log the callback for debugging
        console.log('Received Kie.ai callback:', JSON.stringify(data, null, 2));

        // Process the callback based on status
        if (data.state === 'success') {
            console.log(`Task ${data.taskId} completed successfully`);
            console.log('Video URLs:', data.resultJson ? JSON.parse(data.resultJson) : 'No URLs');
        } else if (data.state === 'fail') {
            console.log(`Task ${data.taskId} failed:`, data.failMsg);
        }

        // Acknowledge receipt
        res.json({ 
            message: 'Callback received successfully',
            taskId: data.taskId,
            status: data.state,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: error.message });
    }
}

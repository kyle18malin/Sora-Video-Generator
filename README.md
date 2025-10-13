# Sora Video Generator

A powerful web application for mass generating Sora videos using the Kie.ai API. This app supports concurrent video generation, batch processing, and real-time task management.

## Features

- 🎥 **Single & Batch Video Generation** - Create one video or process multiple prompts simultaneously
- ⚡ **Concurrent Processing** - Generate multiple videos at the same time (configurable limit)
- 🔄 **Real-time Updates** - WebSocket-powered live task status updates
- 📊 **Task Management** - Track progress, cancel tasks, and view detailed results
- 🎨 **Modern UI** - Beautiful, responsive interface with glassmorphism design
- 📱 **Mobile Friendly** - Works seamlessly on desktop and mobile devices
- 🔔 **Toast Notifications** - Real-time feedback for all actions
- 🗂️ **Task History** - View and manage all your generation tasks

## Prerequisites

- Node.js (v14 or higher)
- Kie.ai API key
- Modern web browser with WebSocket support

## Installation

1. **Clone or download the project**
   ```bash
   cd ugc-script-splitter-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Kie.ai API key:
   ```env
   KIE_API_KEY=your_kie_api_key_here
   KIE_API_BASE_URL=https://api.kie.ai
   PORT=3000
   CALLBACK_BASE_URL=http://localhost:3000
   MAX_CONCURRENT_TASKS=5
   ```

4. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Single Video Generation

1. Enter your video prompt in the text area
2. Select aspect ratio (Landscape or Portrait)
3. Choose whether to remove watermark
4. Click "Generate Video"

### Batch Video Generation

1. Click "Batch Mode" to switch to batch processing
2. Enter multiple prompts (one per line)
3. Configure settings for all videos
4. Click "Generate All"

### Task Management

- **View Tasks**: All tasks appear in the main list with real-time status updates
- **Task Details**: Click any task to view detailed information and generated videos
- **Cancel Tasks**: Cancel processing or generating tasks
- **Clear Completed**: Remove completed tasks from the list
- **Progress Tracking**: See real-time progress bars and status updates

## API Endpoints

The application provides a REST API for programmatic access:

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create single task
- `POST /api/tasks/batch` - Create multiple tasks
- `DELETE /api/tasks/:id` - Cancel task

### Callbacks
- `POST /api/callback` - Kie.ai completion notifications

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KIE_API_KEY` | Your Kie.ai API key | Required |
| `KIE_API_BASE_URL` | Kie.ai API base URL | `https://api.kie.ai` |
| `PORT` | Server port | `3000` |
| `CALLBACK_BASE_URL` | Base URL for callbacks | `http://localhost:3000` |
| `MAX_CONCURRENT_TASKS` | Maximum concurrent generations | `5` |
| `TASK_TIMEOUT_MINUTES` | Task timeout in minutes | `30` |

### Task Limits

- **Prompt Length**: Maximum 5000 characters
- **Concurrent Tasks**: Configurable via `MAX_CONCURRENT_TASKS`
- **Task Cleanup**: Completed tasks older than 24 hours are automatically cleaned up

## Architecture

### Backend (Node.js + Express)
- **Task Queue System**: Manages concurrent video generation
- **WebSocket Server**: Real-time updates to frontend
- **Kie.ai Integration**: Handles API calls and callbacks
- **In-memory Storage**: Task persistence (can be replaced with database)

### Frontend (Vanilla JavaScript)
- **Modern UI**: Glassmorphism design with responsive layout
- **Real-time Updates**: WebSocket integration for live status
- **Task Management**: Create, view, and manage generation tasks
- **Batch Processing**: Handle multiple prompts efficiently

## Development

### Project Structure
```
├── src/
│   └── index.js          # Main server file
├── public/
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── main.js       # Frontend JavaScript
├── package.json          # Dependencies
├── env.example          # Environment template
└── README.md            # This file
```

### Adding Features

The application is designed to be easily extensible:

1. **New API Endpoints**: Add routes in `src/index.js`
2. **Frontend Features**: Extend the `SoraVideoGenerator` class in `js/main.js`
3. **UI Components**: Add styles in `css/style.css`
4. **Database Integration**: Replace in-memory storage with your preferred database

### WebSocket Events

The application uses WebSocket for real-time communication:

- `initial_data` - Send all tasks to new client
- `task_created` - New task created
- `task_update` - Task status/progress updated
- `task_completed` - Task finished (success or failure)

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the server is running
   - Check firewall settings
   - Verify port availability

2. **API Key Issues**
   - Verify your Kie.ai API key is correct
   - Check if the key has sufficient credits
   - Ensure the key has proper permissions

3. **Tasks Not Processing**
   - Check server logs for errors
   - Verify Kie.ai API connectivity
   - Ensure callback URL is accessible

4. **Videos Not Loading**
   - Check if generated URLs are accessible
   - Verify CORS settings
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL, MongoDB, etc.)
3. Set up proper SSL certificates
4. Configure reverse proxy (nginx, Apache)
5. Set up monitoring and logging

### Database Integration
Replace in-memory storage with a database:

```javascript
// Example with SQLite
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('tasks.db');

// Create tasks table
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    options TEXT,
    status TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    kieTaskId TEXT,
    result TEXT,
    error TEXT,
    progress INTEGER
  )
`);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Check Kie.ai API documentation
4. Open an issue with detailed information

---

**Note**: This application requires a valid Kie.ai API key and sufficient credits to generate videos. Make sure to monitor your credit usage and set appropriate limits.
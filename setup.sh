#!/bin/bash

echo "🎥 Sora Video Generator Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your Kie.ai API key:"
    echo "   KIE_API_KEY=your_actual_api_key_here"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🚀 Setup complete! To start the application:"
echo "   1. Edit .env and add your Kie.ai API key"
echo "   2. Run: npm start"
echo "   3. Open: http://localhost:3000"
echo ""
echo "📚 For development with auto-restart:"
echo "   npm run dev"
echo ""
echo "🔧 For more information, see README.md"

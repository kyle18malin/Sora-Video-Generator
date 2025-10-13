#!/bin/bash

echo "🔧 Quick ngrok Setup"
echo "===================="
echo ""

echo "1. Go to: https://dashboard.ngrok.com/signup"
echo "2. Sign up for a free account"
echo "3. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "4. Copy your authtoken"
echo "5. Run this command with your token:"
echo "   ngrok config add-authtoken YOUR_TOKEN_HERE"
echo "6. Then run: ngrok http 3000"
echo "7. Copy the https URL (like https://abc123.ngrok.io)"
echo "8. Update your .env file:"
echo "   CALLBACK_BASE_URL=https://abc123.ngrok.io"
echo "9. Restart your server: npm start"
echo ""

echo "⏱️  This takes about 2-3 minutes total"
echo "🎯 Then you'll have real video generation!"

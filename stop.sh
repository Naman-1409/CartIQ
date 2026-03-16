#!/bin/bash
# CartIQ — Stop all services

echo "🛑 Stopping CartIQ services..."
lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "   Stopped Scraper (:8001)"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   Stopped API Gateway (:3001)"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   Stopped Frontend (:3000)"
echo "✅ Done."

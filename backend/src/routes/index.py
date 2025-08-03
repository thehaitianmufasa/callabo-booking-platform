from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        response_data = {
            "service": "LangGraph Multi-Agent System",
            "version": "1.0.0",
            "status": "active",
            "timestamp": datetime.now().isoformat(),
            "endpoints": {
                "/health": "Health check endpoint",
                "/status": "System status and metrics",
                "/task": "Task processing endpoint (POST)"
            },
            "documentation": "https://github.com/your-repo/langgraph-multi-agent",
            "langsmith_integration": "enabled",
            "deployment": "vercel"
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(json.dumps(response_data, indent=2).encode())
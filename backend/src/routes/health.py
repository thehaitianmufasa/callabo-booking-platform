from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from monitoring import get_monitor
    from config import Config
except ImportError:
    # Fallback for deployment
    pass

# Import auth decorators separately
try:
    from auth.vercel_auth import optional_auth_vercel, handle_cors_preflight
except ImportError:
    # Define dummy decorators for compatibility
    def optional_auth_vercel(f):
        return f
    def handle_cors_preflight(handler):
        handler.send_response(200)
        handler.end_headers()

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        handle_cors_preflight(self)
    
    @optional_auth_vercel
    def do_GET(self):
        try:
            # Basic health check
            health_data = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "service": "langgraph-multi-agent",
                "version": "1.0.0",
                "authenticated": getattr(self, 'is_authenticated', False)
            }
            
            # Add user context if authenticated
            if hasattr(self, 'user_id') and self.user_id:
                health_data.update({
                    "user_id": self.user_id,
                    "organization_id": getattr(self, 'organization_id', None)
                })
            
            # Try to get system health if monitoring is available
            try:
                monitor = get_monitor()
                system_health = monitor.get_system_health()
                health_data.update({
                    "system_health": system_health,
                    "langsmith_enabled": Config.LANGCHAIN_TRACING_V2 if 'Config' in globals() else False
                })
            except Exception as e:
                health_data["monitoring_status"] = f"Limited: {str(e)}"
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id')
            self.end_headers()
            
            self.wfile.write(json.dumps(health_data, indent=2).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id')
            self.end_headers()
            
            error_response = {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
            
            self.wfile.write(json.dumps(error_response).encode())
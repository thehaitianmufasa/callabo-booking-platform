from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import asyncio
from urllib.parse import parse_qs

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from master_agent import get_master_agent
    from monitoring import get_monitor
except ImportError:
    pass

# Import auth decorators separately to ensure they're available
try:
    from auth.vercel_auth import authenticated_vercel, optional_auth_vercel, handle_cors_preflight
    from config import Config
except ImportError as e:
    print(f"Warning: Auth imports failed: {e}")
    # Define dummy decorators for compatibility
    def authenticated_vercel(f):
        return f
    def optional_auth_vercel(f):
        return f
    def handle_cors_preflight(handler):
        handler.send_response(200)
        handler.end_headers()

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        handle_cors_preflight(self)
    
    @authenticated_vercel
    def do_POST(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON")
                return
            
            # Extract task parameters
            task_content = data.get('task')
            priority = data.get('priority', 'medium')
            context = data.get('context', {})
            
            # Add user context if authenticated
            if hasattr(self, 'user_id') and self.user_id:
                context['user_id'] = self.user_id
                context['user_email'] = self.user_email
                if hasattr(self, 'organization_id') and self.organization_id:
                    context['organization_id'] = self.organization_id
                    context['organization_role'] = self.organization_role
            
            if not task_content:
                self.send_error_response(400, "Task content is required")
                return
            
            # Process the task
            try:
                master_agent = get_master_agent()
                
                # Run async task processing
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                response = loop.run_until_complete(
                    master_agent.process_task(task_content, priority, context)
                )
                
                loop.close()
                
                # Record metrics if available
                try:
                    monitor = get_monitor()
                    # Could add task tracking here
                except:
                    pass
                
                response_data = {
                    "status": "completed",
                    "task": task_content,
                    "priority": priority,
                    "response": response,
                    "context": context,
                    "user_id": getattr(self, 'user_id', None),
                    "organization_id": getattr(self, 'organization_id', None)
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id')
                self.end_headers()
                
                self.wfile.write(json.dumps(response_data, indent=2).encode())
                
            except Exception as e:
                self.send_error_response(500, f"Task processing failed: {str(e)}")
                
        except Exception as e:
            self.send_error_response(500, f"Request handling failed: {str(e)}")
    
    @optional_auth_vercel
    def do_GET(self):
        # Simple GET endpoint for testing
        response_data = {
            "message": "Task endpoint is ready",
            "method": "POST",
            "expected_payload": {
                "task": "Your task description",
                "priority": "high|medium|low",
                "context": {}
            },
            "authentication_required": True,
            "authenticated": getattr(self, 'is_authenticated', False)
        }
        
        if hasattr(self, 'user_id') and self.user_id:
            response_data['user_id'] = self.user_id
            response_data['organization_id'] = getattr(self, 'organization_id', None)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id')
        self.end_headers()
        
        self.wfile.write(json.dumps(response_data, indent=2).encode())
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id')
        self.end_headers()
        
        error_response = {
            "status": "error",
            "message": message
        }
        
        self.wfile.write(json.dumps(error_response).encode())
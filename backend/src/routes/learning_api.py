"""
Learning API Endpoints

Provides REST API access to the learning system data and real-time updates.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from flask import Blueprint, jsonify, request
import websockets
from websockets.server import WebSocketServerProtocol

from agent_learning import AgentLearningSystem
from agent_learning.evolution_engine import EvolutionEngine
from api.websocket_manager import get_websocket_manager
from claude_langgraph_bridge import get_claude_bridge

logger = logging.getLogger(__name__)

# Create Flask blueprint
learning_api = Blueprint('learning_api', __name__, url_prefix='/api/learning')

# Global instances
learning_system = AgentLearningSystem()
evolution_engine = EvolutionEngine()

@learning_api.route('/error-patterns', methods=['GET'])
def get_error_patterns():
    """Get all learned error patterns"""
    try:
        patterns = []
        
        for error_id, learning in learning_system.db.error_learnings.items():
            pattern = {
                "pattern": learning.error_type,
                "occurrences": 1,  # Simplified - in real impl, count occurrences
                "lastSeen": learning.timestamp.isoformat(),
                "rootCause": learning.root_cause.get("description", "Unknown"),
                "prevention": learning.prevention_rule.get("prevention_strategy", {}).get("name", "Unknown"),
                "effectiveness": (learning.prevented_count / max(learning.prevented_count + 1, 1)) * 100
            }
            patterns.append(pattern)
        
        # Sort by most recent
        patterns.sort(key=lambda x: x["lastSeen"], reverse=True)
        
        return jsonify({
            "patterns": patterns,
            "total": len(patterns),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get error patterns: {e}")
        return jsonify({"error": str(e)}), 500

@learning_api.route('/success-patterns', methods=['GET'])
def get_success_patterns():
    """Get all discovered success patterns"""
    try:
        patterns = []
        
        for pattern_id, pattern in learning_system.db.success_patterns.items():
            success_pattern = {
                "pattern": pattern.pattern_name,
                "reliability": pattern.success_rate,
                "conditions": pattern.conditions,
                "recommendation": f"Use {pattern.pattern_name} strategy for optimal results"
            }
            patterns.append(success_pattern)
        
        # Sort by reliability
        patterns.sort(key=lambda x: x["reliability"], reverse=True)
        
        return jsonify({
            "patterns": patterns,
            "total": len(patterns),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get success patterns: {e}")
        return jsonify({"error": str(e)}), 500

@learning_api.route('/evolution-metrics', methods=['GET'])
def get_evolution_metrics():
    """Get evolution and learning metrics"""
    try:
        # Get learning stats
        learning_stats = learning_system.get_learning_stats()
        
        # Get evolution report
        evolution_report = evolution_engine.get_evolution_report()
        
        # Calculate knowledge growth (simplified)
        knowledge_growth = [
            learning_stats.get("errors_learned", 0),
            learning_stats.get("success_patterns", 0),
            evolution_report.get("total_evolutions", 0)
        ]
        
        # Get agent improvements
        agent_improvements = []
        for agent, evolutions in evolution_report.get("evolutions_by_agent", {}).items():
            agent_improvements.append({
                "agent": agent,
                "improvement": min(evolutions * 10, 100)  # Simplified calculation
            })
        
        metrics = {
            "errorsLearned": learning_stats.get("errors_learned", 0),
            "preventionRate": learning_stats.get("prevention_rate", 0.0),
            "knowledgeGrowth": knowledge_growth,
            "agentImprovement": agent_improvements
        }
        
        return jsonify({
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get evolution metrics: {e}")
        return jsonify({"error": str(e)}), 500

@learning_api.route('/recent-evolutions', methods=['GET'])
def get_recent_evolutions():
    """Get recent agent evolutions"""
    try:
        evolution_report = evolution_engine.get_evolution_report()
        recent_evolutions = evolution_report.get("recent_evolutions", [])
        
        # Format for frontend
        formatted_evolutions = []
        for evolution in recent_evolutions:
            formatted_evolutions.append({
                "agent": evolution.get("agent", "unknown"),
                "type": evolution.get("type", "unknown"),
                "improvement": evolution.get("improvement", 0),
                "timestamp": evolution.get("timestamp", datetime.now().isoformat())
            })
        
        return jsonify({
            "evolutions": formatted_evolutions,
            "total": len(formatted_evolutions),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get recent evolutions: {e}")
        return jsonify({"error": str(e)}), 500

@learning_api.route('/system-status', methods=['GET'])
def get_system_status():
    """Get overall learning system status"""
    try:
        # Get learning system stats
        learning_stats = learning_system.get_learning_stats()
        
        # Get WebSocket manager status
        websocket_manager = get_websocket_manager()
        ws_status = websocket_manager.get_manager_status()
        
        # Get bridge status
        bridge = get_claude_bridge()
        bridge_status = bridge.get_bridge_status()
        
        # Get evolution engine status
        evolution_report = evolution_engine.get_evolution_report()
        
        status = {
            "learning_system": {
                "active": True,
                "errors_learned": learning_stats.get("errors_learned", 0),
                "prevention_rate": learning_stats.get("prevention_rate", 0.0),
                "knowledge_base_size": learning_stats.get("errors_learned", 0) + learning_stats.get("success_patterns", 0)
            },
            "websocket_manager": {
                "active": ws_status.get("server_running", False),
                "connections": ws_status.get("active_connections", 0),
                "patterns_learned": ws_status.get("failure_patterns", 0)
            },
            "claude_bridge": {
                "active": True,
                "active_tasks": bridge_status.get("active_tasks", 0),
                "success_rate": self._calculate_bridge_success_rate(bridge_status),
                "learning_applications": bridge_status.get("performance_metrics", {}).get("learning_applications", 0)
            },
            "evolution_engine": {
                "active": True,
                "total_evolutions": evolution_report.get("total_evolutions", 0),
                "average_improvement": evolution_report.get("average_improvement", 0.0),
                "agents_evolved": len(evolution_report.get("agent_versions", {}))
            },
            "overall_health": "healthy"  # Would be calculated based on various factors
        }
        
        return jsonify({
            "status": status,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        return jsonify({"error": str(e)}), 500

def _calculate_bridge_success_rate(bridge_status: Dict[str, Any]) -> float:
    """Calculate success rate for the bridge"""
    metrics = bridge_status.get("performance_metrics", {})
    total = metrics.get("total_requests", 0)
    successful = metrics.get("successful_requests", 0)
    
    if total == 0:
        return 1.0
    
    return successful / total

@learning_api.route('/inject-learning', methods=['POST'])
def inject_learning():
    """Manually inject a learning scenario (for testing)"""
    try:
        data = request.get_json()
        
        if not data or 'scenario_type' not in data:
            return jsonify({"error": "scenario_type required"}), 400
        
        scenario_type = data['scenario_type']
        description = data.get('description', f'Manual injection: {scenario_type}')
        
        # Create a mock error for learning
        mock_error = Exception(f"Injected learning scenario: {scenario_type}")
        
        error_context = {
            "error": mock_error,
            "task": {
                "type": "manual_injection",
                "scenario": scenario_type,
                "description": description
            },
            "agent_name": "learning_api",
            "timestamp": datetime.now(),
            "context": {"manual_injection": True}
        }
        
        # Process through learning system
        asyncio.create_task(_process_injected_learning(error_context))
        
        return jsonify({
            "success": True,
            "message": f"Learning scenario '{scenario_type}' injected",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to inject learning: {e}")
        return jsonify({"error": str(e)}), 500

async def _process_injected_learning(error_context: Dict[str, Any]):
    """Process injected learning scenario"""
    try:
        learning = await learning_system.capture_error(error_context)
        logger.info(f"Processed injected learning: {learning.get('error_id', 'unknown')}")
        
        # Broadcast to WebSocket clients
        websocket_manager = get_websocket_manager()
        await websocket_manager.broadcast_with_learning({
            "type": "learning_in_progress",
            "description": f"Processing {error_context['task']['scenario']} scenario"
        })
        
    except Exception as e:
        logger.error(f"Failed to process injected learning: {e}")

@learning_api.route('/learning-history', methods=['GET'])
def get_learning_history():
    """Get historical learning data"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get all error learnings
        all_learnings = list(learning_system.db.error_learnings.values())
        all_learnings.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply pagination
        paginated_learnings = all_learnings[offset:offset + limit]
        
        # Format for response
        history = []
        for learning in paginated_learnings:
            history.append({
                "id": learning.error_id,
                "type": learning.error_type,
                "message": learning.error_message,
                "root_cause": learning.root_cause.get("description", "Unknown"),
                "fix_applied": learning.fix_applied.get("successful", False),
                "prevented_count": learning.prevented_count,
                "timestamp": learning.timestamp.isoformat(),
                "agent": learning.agent_name
            })
        
        return jsonify({
            "history": history,
            "total": len(all_learnings),
            "limit": limit,
            "offset": offset,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get learning history: {e}")
        return jsonify({"error": str(e)}), 500

@learning_api.route('/analytics', methods=['GET'])
def get_learning_analytics():
    """Get advanced learning analytics"""
    try:
        # Calculate analytics
        all_learnings = list(learning_system.db.error_learnings.values())
        
        # Time-based analytics
        now = datetime.now()
        last_24h = [l for l in all_learnings if (now - l.timestamp).total_seconds() < 86400]
        last_week = [l for l in all_learnings if (now - l.timestamp).total_seconds() < 604800]
        
        # Error type distribution
        error_types = {}
        for learning in all_learnings:
            error_type = learning.error_type
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        # Agent performance
        agent_stats = {}
        for learning in all_learnings:
            agent = learning.agent_name
            if agent not in agent_stats:
                agent_stats[agent] = {"errors": 0, "prevented": 0}
            agent_stats[agent]["errors"] += 1
            agent_stats[agent]["prevented"] += learning.prevented_count
        
        # Calculate prevention rates per agent
        for agent in agent_stats:
            stats = agent_stats[agent]
            total = stats["errors"] + stats["prevented"]
            stats["prevention_rate"] = stats["prevented"] / max(total, 1)
        
        analytics = {
            "overview": {
                "total_learnings": len(all_learnings),
                "last_24h": len(last_24h),
                "last_week": len(last_week),
                "overall_prevention_rate": sum(l.prevented_count for l in all_learnings) / max(len(all_learnings), 1)
            },
            "error_distribution": [
                {"type": error_type, "count": count}
                for error_type, count in sorted(error_types.items(), key=lambda x: x[1], reverse=True)
            ],
            "agent_performance": [
                {"agent": agent, **stats}
                for agent, stats in sorted(agent_stats.items(), key=lambda x: x[1]["prevention_rate"], reverse=True)
            ],
            "trends": {
                "daily_learnings": self._calculate_daily_learnings(all_learnings),
                "prevention_trend": self._calculate_prevention_trend(all_learnings)
            }
        }
        
        return jsonify({
            "analytics": analytics,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get learning analytics: {e}")
        return jsonify({"error": str(e)}), 500

def _calculate_daily_learnings(learnings: List[Any]) -> List[Dict[str, Any]]:
    """Calculate daily learning counts for the last 7 days"""
    daily_counts = {}
    now = datetime.now()
    
    for learning in learnings:
        # Only include last 7 days
        if (now - learning.timestamp).days <= 7:
            date_key = learning.timestamp.strftime('%Y-%m-%d')
            daily_counts[date_key] = daily_counts.get(date_key, 0) + 1
    
    # Fill in missing days with 0
    result = []
    for i in range(7):
        date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        result.append({
            "date": date,
            "count": daily_counts.get(date, 0)
        })
    
    return sorted(result, key=lambda x: x["date"])

def _calculate_prevention_trend(learnings: List[Any]) -> List[Dict[str, Any]]:
    """Calculate prevention rate trend over time"""
    # Simplified calculation - in real implementation would be more sophisticated
    if not learnings:
        return []
    
    # Group by week
    weekly_prevention = {}
    for learning in learnings:
        week_start = learning.timestamp - timedelta(days=learning.timestamp.weekday())
        week_key = week_start.strftime('%Y-%m-%d')
        
        if week_key not in weekly_prevention:
            weekly_prevention[week_key] = {"total": 0, "prevented": 0}
        
        weekly_prevention[week_key]["total"] += 1
        weekly_prevention[week_key]["prevented"] += learning.prevented_count
    
    # Calculate rates
    result = []
    for week, data in sorted(weekly_prevention.items()):
        rate = data["prevented"] / max(data["total"], 1)
        result.append({
            "week": week,
            "prevention_rate": rate
        })
    
    return result[-8:]  # Last 8 weeks

# WebSocket handlers for real-time updates
class LearningWebSocketHandler:
    """Handle WebSocket connections for real-time learning updates"""
    
    def __init__(self):
        self.subscribers: List[WebSocketServerProtocol] = []
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket client"""
        self.subscribers.append(websocket)
        logger.info(f"Learning WebSocket client connected: {len(self.subscribers)} total")
        
        try:
            # Send initial data
            await self._send_initial_data(websocket)
            
            # Keep connection alive
            async for message in websocket:
                data = json.loads(message)
                await self._handle_message(websocket, data)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("Learning WebSocket client disconnected")
        except Exception as e:
            logger.error(f"Learning WebSocket error: {e}")
        finally:
            if websocket in self.subscribers:
                self.subscribers.remove(websocket)
    
    async def _send_initial_data(self, websocket: WebSocketServerProtocol):
        """Send initial data to new client"""
        try:
            # Send current metrics
            learning_stats = learning_system.get_learning_stats()
            await websocket.send(json.dumps({
                "type": "evolution_metrics",
                "metrics": {
                    "errorsLearned": learning_stats.get("errors_learned", 0),
                    "preventionRate": learning_stats.get("prevention_rate", 0.0),
                    "knowledgeGrowth": [learning_stats.get("errors_learned", 0)],
                    "agentImprovement": []
                }
            }))
            
        except Exception as e:
            logger.error(f"Failed to send initial data: {e}")
    
    async def _handle_message(self, websocket: WebSocketServerProtocol, data: Dict[str, Any]):
        """Handle message from client"""
        msg_type = data.get("type")
        
        if msg_type == "subscribe":
            channel = data.get("channel", "all")
            # In real implementation, would manage subscriptions per channel
            logger.info(f"Client subscribed to channel: {channel}")
            
        elif msg_type == "ping":
            await websocket.send(json.dumps({"type": "pong"}))
    
    async def broadcast_learning_update(self, update: Dict[str, Any]):
        """Broadcast learning update to all subscribers"""
        if not self.subscribers:
            return
        
        message = json.dumps(update)
        disconnected = []
        
        for websocket in self.subscribers:
            try:
                await websocket.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(websocket)
            except Exception as e:
                logger.error(f"Failed to send learning update: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected clients
        for websocket in disconnected:
            if websocket in self.subscribers:
                self.subscribers.remove(websocket)

# Global WebSocket handler
learning_ws_handler = LearningWebSocketHandler()

# Function to start WebSocket server
async def start_learning_websocket_server(host: str = "localhost", port: int = 8766):
    """Start the learning WebSocket server"""
    logger.info(f"Starting learning WebSocket server on {host}:{port}")
    
    server = await websockets.serve(
        learning_ws_handler.handle_client,
        host,
        port
    )
    
    logger.info("Learning WebSocket server started")
    return server
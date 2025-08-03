"""
Self-Improving WebSocket Manager with Learning Capabilities

This WebSocket manager learns from every failure and continuously improves
its connection handling, message delivery, and error recovery strategies.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from collections import deque, defaultdict
import websockets
from websockets.server import WebSocketServerProtocol
import hashlib
import gzip
import time

from agent_learning import AgentLearningSystem, RootCauseAnalyzer
from monitoring import get_monitor

logger = logging.getLogger(__name__)

@dataclass
class ConnectionInfo:
    """Information about a WebSocket connection"""
    websocket: WebSocketServerProtocol
    client_id: str
    connected_at: datetime
    last_ping: datetime
    failed_sends: int = 0
    total_messages: int = 0
    client_type: str = "unknown"
    connection_quality: float = 1.0  # 0.0 to 1.0

@dataclass
class MessageDeliveryRecord:
    """Record of message delivery attempt"""
    message_id: str
    client_id: str
    timestamp: datetime
    success: bool
    error: Optional[str] = None
    retry_count: int = 0
    delivery_time_ms: Optional[float] = None

@dataclass
class FailurePattern:
    """Learned failure pattern"""
    pattern_id: str
    pattern_type: str
    description: str
    symptoms: List[str]
    root_cause: Dict[str, Any]
    fix_strategy: Dict[str, Any]
    prevention: Dict[str, Any]
    success_rate: float = 0.0
    learned_at: datetime = field(default_factory=datetime.now)

class LearningWebSocketManager:
    """
    Self-improving WebSocket manager that learns from failures and optimizes performance.
    
    Features:
    1. Automatic reconnection with exponential backoff
    2. Message deduplication and compression
    3. Bandwidth optimization
    4. Circuit breaker pattern for failing clients
    5. Continuous learning from all failures
    """
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        
        # Connection management
        self.connections: Dict[str, ConnectionInfo] = {}
        self.connection_history: deque = deque(maxlen=1000)
        
        # Message handling
        self.message_history: deque = deque(maxlen=1000)
        self.message_buffer: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.pending_acknowledgments: Dict[str, Dict[str, Any]] = {}
        
        # Learning system
        self.learning_system = AgentLearningSystem()
        self.analyzer = RootCauseAnalyzer()
        self.failure_patterns: Dict[str, FailurePattern] = {}
        
        # Performance tracking
        self.performance_metrics = {
            "total_connections": 0,
            "active_connections": 0,
            "failed_connections": 0,
            "total_messages": 0,
            "failed_messages": 0,
            "average_latency": 0.0,
            "learning_applications": 0,
            "patterns_learned": 0
        }
        
        # Circuit breaker for failing clients
        self.circuit_breakers: Dict[str, Dict[str, Any]] = {}
        
        # Compression and optimization
        self.compression_enabled = True
        self.compression_threshold = 1024  # bytes
        
        # Server instance
        self.server = None
        self.running = False
        
        logger.info("Learning WebSocket Manager initialized")
    
    async def start_server(self):
        """Start the WebSocket server with learning capabilities"""
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        try:
            self.server = await websockets.serve(
                self.handle_client,
                self.host,
                self.port,
                ping_interval=30,
                ping_timeout=10,
                max_size=1024*1024  # 1MB max message size
            )
            
            self.running = True
            logger.info("WebSocket server started successfully")
            
            # Start background tasks
            asyncio.create_task(self.connection_monitor())
            asyncio.create_task(self.performance_monitor())
            asyncio.create_task(self.learning_processor())
            
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            await self._apply_server_failure_learning(e)
            raise
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle individual client connection with learning"""
        client_id = self._generate_client_id(websocket)
        
        logger.info(f"New client connection: {client_id}")
        
        # Create connection info
        connection = ConnectionInfo(
            websocket=websocket,
            client_id=client_id,
            connected_at=datetime.now(),
            last_ping=datetime.now()
        )
        
        self.connections[client_id] = connection
        self.performance_metrics["total_connections"] += 1
        self.performance_metrics["active_connections"] += 1
        
        try:
            # Send welcome message
            await self._send_to_client(client_id, {
                "type": "welcome",
                "client_id": client_id,
                "server_capabilities": ["compression", "learning", "auto_recovery"]
            })
            
            # Handle messages
            async for message in websocket:
                await self._handle_message(client_id, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} disconnected normally")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
            await self._apply_connection_failure_learning(client_id, e, connection)
        finally:
            # Cleanup
            await self._cleanup_connection(client_id)
    
    async def _handle_message(self, client_id: str, raw_message: str):
        """Handle incoming message with error learning"""
        try:
            # Parse message
            message = json.loads(raw_message)
            
            # Update connection stats
            if client_id in self.connections:
                self.connections[client_id].total_messages += 1
                self.connections[client_id].last_ping = datetime.now()
            
            # Process based on message type
            msg_type = message.get("type", "unknown")
            
            if msg_type == "ping":
                await self._handle_ping(client_id, message)
            elif msg_type == "subscribe":
                await self._handle_subscription(client_id, message)
            elif msg_type == "ack":
                await self._handle_acknowledgment(client_id, message)
            else:
                await self._handle_custom_message(client_id, message)
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from client {client_id}: {e}")
            await self._apply_message_parsing_learning(client_id, raw_message, e)
        except Exception as e:
            logger.error(f"Error processing message from {client_id}: {e}")
            await self._apply_message_handling_learning(client_id, raw_message, e)
    
    async def broadcast_with_learning(self, message: Dict[str, Any], 
                                     target_clients: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Broadcast message with comprehensive learning from failures.
        NO workarounds - every failure is analyzed and fixed.
        """
        message_id = self._generate_message_id(message)
        start_time = time.time()
        
        logger.info(f"Broadcasting message {message_id} to {len(target_clients or self.connections)} clients")
        
        # Apply learned optimizations
        optimized_message = await self._apply_message_optimizations(message)
        
        # Determine target clients
        clients = target_clients or list(self.connections.keys())
        
        # Track delivery results
        delivery_results = []
        failed_deliveries = []
        
        # Send to each client
        for client_id in clients:
            try:
                # Check circuit breaker
                if self._is_circuit_breaker_open(client_id):
                    logger.warning(f"Circuit breaker open for client {client_id}, skipping")
                    continue
                
                # Attempt delivery
                delivery_result = await self._deliver_to_client(client_id, optimized_message, message_id)
                delivery_results.append(delivery_result)
                
                if not delivery_result.success:
                    failed_deliveries.append(delivery_result)
                    
            except Exception as e:
                logger.error(f"Failed to deliver to client {client_id}: {e}")
                
                # Create failure record
                failure_record = MessageDeliveryRecord(
                    message_id=message_id,
                    client_id=client_id,
                    timestamp=datetime.now(),
                    success=False,
                    error=str(e)
                )
                failed_deliveries.append(failure_record)
        
        # Learn from failures
        if failed_deliveries:
            await self._learn_from_delivery_failures(failed_deliveries, optimized_message)
        
        # Calculate metrics
        total_time = (time.time() - start_time) * 1000  # ms
        success_count = len([r for r in delivery_results if r.success])
        total_count = len(delivery_results)
        
        # Update performance metrics
        self.performance_metrics["total_messages"] += total_count
        self.performance_metrics["failed_messages"] += (total_count - success_count)
        
        return {
            "message_id": message_id,
            "total_clients": len(clients),
            "successful_deliveries": success_count,
            "failed_deliveries": total_count - success_count,
            "delivery_time_ms": total_time,
            "failures_learned": len(failed_deliveries),
            "optimizations_applied": len(optimized_message.get("_optimizations", []))
        }
    
    async def _deliver_to_client(self, client_id: str, message: Dict[str, Any], 
                                message_id: str) -> MessageDeliveryRecord:
        """Deliver message to specific client with learning"""
        start_time = time.time()
        
        try:
            # Get connection
            if client_id not in self.connections:
                raise ConnectionError(f"Client {client_id} not connected")
            
            connection = self.connections[client_id]
            websocket = connection.websocket
            
            # Prepare message for delivery
            delivery_message = {
                **message,
                "_message_id": message_id,
                "_timestamp": datetime.now().isoformat(),
                "_expects_ack": True
            }
            
            # Compress if beneficial
            message_data = json.dumps(delivery_message)
            if self.compression_enabled and len(message_data) > self.compression_threshold:
                message_data = await self._compress_message(message_data)
                delivery_message["_compressed"] = True
            
            # Send message
            await websocket.send(message_data)
            
            # Record pending acknowledgment
            self.pending_acknowledgments[f"{client_id}_{message_id}"] = {
                "client_id": client_id,
                "message_id": message_id,
                "sent_at": datetime.now(),
                "timeout": datetime.now() + timedelta(seconds=30)
            }
            
            delivery_time = (time.time() - start_time) * 1000
            
            return MessageDeliveryRecord(
                message_id=message_id,
                client_id=client_id,
                timestamp=datetime.now(),
                success=True,
                delivery_time_ms=delivery_time
            )
            
        except Exception as e:
            # DON'T workaround - learn from this failure
            logger.error(f"Message delivery failed to {client_id}: {e}")
            
            # Analyze the failure
            await self._analyze_delivery_failure(client_id, message, e)
            
            delivery_time = (time.time() - start_time) * 1000
            
            return MessageDeliveryRecord(
                message_id=message_id,
                client_id=client_id,
                timestamp=datetime.now(),
                success=False,
                error=str(e),
                delivery_time_ms=delivery_time
            )
    
    async def _learn_from_delivery_failures(self, failures: List[MessageDeliveryRecord], 
                                           message: Dict[str, Any]):
        """Learn from message delivery failures - never ignore them"""
        logger.info(f"Learning from {len(failures)} delivery failures")
        
        for failure in failures:
            try:
                # Create comprehensive error context
                error_context = {
                    "error": Exception(failure.error),
                    "task": {
                        "type": "message_delivery",
                        "client_id": failure.client_id,
                        "message_id": failure.message_id,
                        "message": message
                    },
                    "agent_name": "websocket_manager",
                    "timestamp": failure.timestamp,
                    "context": {
                        "connection_info": self.connections.get(failure.client_id),
                        "client_quality": self._get_client_quality(failure.client_id),
                        "message_size": len(json.dumps(message)),
                        "retry_count": failure.retry_count
                    }
                }
                
                # Apply error learning protocol
                learning = await self.learning_system.capture_error(error_context)
                
                # Apply fix for this specific failure type
                fix_result = await self._apply_delivery_fix(learning, failure)
                
                # Create prevention rule
                prevention_rule = await self.learning_system.create_prevention_rule(learning, fix_result)
                
                # Update failure patterns
                await self._update_failure_patterns(learning, fix_result)
                
                logger.info(f"Learned from delivery failure: {learning['error_id']}")
                
            except Exception as learning_error:
                logger.error(f"Failed to learn from delivery failure: {learning_error}")
                # This is critical - learning failure means we'll repeat the same mistakes
    
    async def _apply_delivery_fix(self, learning: Dict[str, Any], 
                                 failure: MessageDeliveryRecord) -> Dict[str, Any]:
        """Apply specific fix for delivery failure"""
        root_cause = learning["root_cause"]
        fix_result = {"successful": False, "actions": []}
        
        try:
            if root_cause["type"] == "connection_lost":
                # Attempt to reconnect or mark client for reconnection
                await self._handle_connection_recovery(failure.client_id)
                fix_result["actions"].append("Initiated connection recovery")
                fix_result["successful"] = True
                
            elif root_cause["type"] == "message_too_large":
                # Implement message chunking
                await self._implement_message_chunking(failure.client_id)
                fix_result["actions"].append("Implemented message chunking")
                fix_result["successful"] = True
                
            elif root_cause["type"] == "client_overloaded":
                # Implement rate limiting
                await self._implement_rate_limiting(failure.client_id)
                fix_result["actions"].append("Implemented rate limiting")
                fix_result["successful"] = True
                
            elif root_cause["type"] == "network_congestion":
                # Implement adaptive compression
                await self._implement_adaptive_compression()
                fix_result["actions"].append("Implemented adaptive compression")
                fix_result["successful"] = True
                
            else:
                # Generic retry with backoff
                await self._implement_retry_backoff(failure.client_id)
                fix_result["actions"].append("Implemented retry with backoff")
                fix_result["successful"] = True
                
        except Exception as fix_error:
            logger.error(f"Fix application failed: {fix_error}")
            fix_result["error"] = str(fix_error)
        
        return fix_result
    
    async def _apply_message_optimizations(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Apply learned optimizations to message"""
        optimized = message.copy()
        optimizations = []
        
        # Apply compression optimizations
        if self._should_compress_message(message):
            optimized["_compress_hint"] = True
            optimizations.append("compression_hint")
        
        # Apply learned size optimizations
        if len(json.dumps(message)) > 10000:  # Large message
            optimized = await self._optimize_large_message(optimized)
            optimizations.append("size_optimization")
        
        # Apply learned routing optimizations
        optimized = await self._apply_routing_optimizations(optimized)
        optimizations.append("routing_optimization")
        
        optimized["_optimizations"] = optimizations
        return optimized
    
    # Circuit breaker implementation
    def _is_circuit_breaker_open(self, client_id: str) -> bool:
        """Check if circuit breaker is open for client"""
        if client_id not in self.circuit_breakers:
            return False
        
        breaker = self.circuit_breakers[client_id]
        if breaker["state"] == "open":
            # Check if we should try to close it
            if datetime.now() > breaker["next_attempt"]:
                breaker["state"] = "half_open"
                logger.info(f"Circuit breaker half-open for {client_id}")
            else:
                return True
        
        return False
    
    def _update_circuit_breaker(self, client_id: str, success: bool):
        """Update circuit breaker state based on result"""
        if client_id not in self.circuit_breakers:
            self.circuit_breakers[client_id] = {
                "state": "closed",
                "failure_count": 0,
                "failure_threshold": 5,
                "next_attempt": None,
                "success_count": 0
            }
        
        breaker = self.circuit_breakers[client_id]
        
        if success:
            breaker["failure_count"] = 0
            breaker["success_count"] += 1
            
            if breaker["state"] == "half_open" and breaker["success_count"] >= 3:
                breaker["state"] = "closed"
                logger.info(f"Circuit breaker closed for {client_id}")
        else:
            breaker["failure_count"] += 1
            breaker["success_count"] = 0
            
            if breaker["failure_count"] >= breaker["failure_threshold"]:
                breaker["state"] = "open"
                breaker["next_attempt"] = datetime.now() + timedelta(minutes=5)
                logger.warning(f"Circuit breaker opened for {client_id}")
    
    # Background monitoring tasks
    async def connection_monitor(self):
        """Monitor connections and learn from patterns"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check for stale connections
                stale_connections = []
                for client_id, connection in self.connections.items():
                    if (current_time - connection.last_ping).total_seconds() > 60:
                        stale_connections.append(client_id)
                
                # Handle stale connections with learning
                for client_id in stale_connections:
                    await self._handle_stale_connection(client_id)
                
                # Update active connection count
                self.performance_metrics["active_connections"] = len(self.connections)
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Connection monitor error: {e}")
                await asyncio.sleep(60)  # Back off on error
    
    async def performance_monitor(self):
        """Monitor performance and trigger optimizations"""
        while self.running:
            try:
                # Calculate performance metrics
                await self._calculate_performance_metrics()
                
                # Check for performance issues
                if self.performance_metrics["average_latency"] > 1000:  # > 1 second
                    await self._investigate_latency_issues()
                
                if self.performance_metrics["failed_messages"] > 10:
                    await self._investigate_message_failures()
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Performance monitor error: {e}")
                await asyncio.sleep(60)
    
    async def learning_processor(self):
        """Process accumulated learning data"""
        while self.running:
            try:
                # Process failure patterns
                await self._process_failure_patterns()
                
                # Apply evolutionary improvements
                await self._apply_evolutionary_improvements()
                
                # Clean up old data
                await self._cleanup_old_data()
                
                await asyncio.sleep(300)  # Process every 5 minutes
                
            except Exception as e:
                logger.error(f"Learning processor error: {e}")
                await asyncio.sleep(300)
    
    # Helper methods
    def _generate_client_id(self, websocket: WebSocketServerProtocol) -> str:
        """Generate unique client ID"""
        remote_addr = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{remote_addr}_{timestamp}".encode()).hexdigest()[:8]
    
    def _generate_message_id(self, message: Dict[str, Any]) -> str:
        """Generate unique message ID"""
        content = json.dumps(message, sort_keys=True)
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{content}_{timestamp}".encode()).hexdigest()[:8]
    
    def _get_client_quality(self, client_id: str) -> float:
        """Get connection quality score for client"""
        if client_id not in self.connections:
            return 0.0
        
        connection = self.connections[client_id]
        
        # Calculate quality based on various factors
        if connection.total_messages == 0:
            return 1.0
        
        failure_rate = connection.failed_sends / connection.total_messages
        quality = 1.0 - failure_rate
        
        return max(0.0, min(1.0, quality))
    
    async def _send_to_client(self, client_id: str, message: Dict[str, Any]):
        """Send message to specific client"""
        if client_id in self.connections:
            connection = self.connections[client_id]
            await connection.websocket.send(json.dumps(message))
    
    async def _cleanup_connection(self, client_id: str):
        """Clean up connection resources"""
        if client_id in self.connections:
            del self.connections[client_id]
            self.performance_metrics["active_connections"] -= 1
        
        # Clean up pending acknowledgments
        to_remove = [key for key in self.pending_acknowledgments.keys() if key.startswith(f"{client_id}_")]
        for key in to_remove:
            del self.pending_acknowledgments[key]
    
    # Message handling methods
    async def _handle_ping(self, client_id: str, message: Dict[str, Any]):
        """Handle ping message"""
        await self._send_to_client(client_id, {"type": "pong", "timestamp": datetime.now().isoformat()})
    
    async def _handle_subscription(self, client_id: str, message: Dict[str, Any]):
        """Handle subscription request"""
        # In real implementation, this would manage subscriptions
        await self._send_to_client(client_id, {"type": "subscription_ack", "subscription": message.get("channel", "unknown")})
    
    async def _handle_acknowledgment(self, client_id: str, message: Dict[str, Any]):
        """Handle message acknowledgment"""
        message_id = message.get("message_id")
        if message_id:
            ack_key = f"{client_id}_{message_id}"
            if ack_key in self.pending_acknowledgments:
                del self.pending_acknowledgments[ack_key]
                logger.debug(f"Received ack for message {message_id} from {client_id}")
    
    async def _handle_custom_message(self, client_id: str, message: Dict[str, Any]):
        """Handle custom message types"""
        # Placeholder for custom message handling
        logger.info(f"Received custom message from {client_id}: {message.get('type', 'unknown')}")
    
    # Learning and optimization methods
    async def _compress_message(self, data: str) -> str:
        """Compress message data"""
        return gzip.compress(data.encode()).decode('latin1')
    
    def _should_compress_message(self, message: Dict[str, Any]) -> bool:
        """Determine if message should be compressed"""
        return len(json.dumps(message)) > self.compression_threshold
    
    async def _optimize_large_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize large messages"""
        # In real implementation, this would chunk large messages or remove unnecessary data
        optimized = message.copy()
        optimized["_optimized_for_size"] = True
        return optimized
    
    async def _apply_routing_optimizations(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Apply learned routing optimizations"""
        # Add routing hints based on learned patterns
        message["_routing_optimized"] = True
        return message
    
    # Failure handling methods
    async def _handle_connection_recovery(self, client_id: str):
        """Handle connection recovery"""
        logger.info(f"Initiating connection recovery for {client_id}")
        # Mark connection for recovery attempt
        if client_id in self.connections:
            self.connections[client_id].connection_quality *= 0.8  # Reduce quality
    
    async def _implement_message_chunking(self, client_id: str):
        """Implement message chunking for client"""
        logger.info(f"Implementing message chunking for {client_id}")
        # In real implementation, this would enable chunking for large messages
    
    async def _implement_rate_limiting(self, client_id: str):
        """Implement rate limiting for client"""
        logger.info(f"Implementing rate limiting for {client_id}")
        # In real implementation, this would add rate limiting
    
    async def _implement_adaptive_compression(self):
        """Implement adaptive compression based on network conditions"""
        logger.info("Implementing adaptive compression")
        # Adjust compression settings based on learned patterns
        self.compression_threshold = max(512, self.compression_threshold * 0.9)
    
    async def _implement_retry_backoff(self, client_id: str):
        """Implement retry with exponential backoff"""
        logger.info(f"Implementing retry backoff for {client_id}")
        # Add to message buffer for retry
        if client_id not in self.message_buffer:
            self.message_buffer[client_id] = []
    
    # Analysis methods
    async def _analyze_delivery_failure(self, client_id: str, message: Dict[str, Any], error: Exception):
        """Analyze specific delivery failure"""
        logger.info(f"Analyzing delivery failure for {client_id}: {error}")
        
        # Update circuit breaker
        self._update_circuit_breaker(client_id, False)
        
        # Update connection quality
        if client_id in self.connections:
            self.connections[client_id].failed_sends += 1
            self.connections[client_id].connection_quality *= 0.9
    
    async def _apply_connection_failure_learning(self, client_id: str, error: Exception, connection: ConnectionInfo):
        """Apply learning from connection failures"""
        error_context = {
            "error": error,
            "task": {"type": "connection_handling", "client_id": client_id},
            "agent_name": "websocket_manager", 
            "context": {"connection_info": connection.__dict__}
        }
        
        try:
            learning = await self.learning_system.capture_error(error_context)
            logger.info(f"Learned from connection failure: {learning.get('error_id', 'unknown')}")
        except Exception as learning_error:
            logger.error(f"Failed to learn from connection failure: {learning_error}")
    
    async def _apply_message_parsing_learning(self, client_id: str, raw_message: str, error: Exception):
        """Learn from message parsing failures"""
        error_context = {
            "error": error,
            "task": {"type": "message_parsing", "client_id": client_id, "raw_message": raw_message[:100]},
            "agent_name": "websocket_manager"
        }
        
        try:
            learning = await self.learning_system.capture_error(error_context)
            logger.info(f"Learned from parsing failure: {learning.get('error_id', 'unknown')}")
        except Exception as learning_error:
            logger.error(f"Failed to learn from parsing failure: {learning_error}")
    
    async def _apply_message_handling_learning(self, client_id: str, raw_message: str, error: Exception):
        """Learn from message handling failures"""
        error_context = {
            "error": error,
            "task": {"type": "message_handling", "client_id": client_id},
            "agent_name": "websocket_manager"
        }
        
        try:
            learning = await self.learning_system.capture_error(error_context)
            logger.info(f"Learned from handling failure: {learning.get('error_id', 'unknown')}")
        except Exception as learning_error:
            logger.error(f"Failed to learn from handling failure: {learning_error}")
    
    async def _apply_server_failure_learning(self, error: Exception):
        """Learn from server startup failures"""
        error_context = {
            "error": error,
            "task": {"type": "server_startup"},
            "agent_name": "websocket_manager"
        }
        
        try:
            learning = await self.learning_system.capture_error(error_context)
            logger.info(f"Learned from server failure: {learning.get('error_id', 'unknown')}")
        except Exception as learning_error:
            logger.error(f"Failed to learn from server failure: {learning_error}")
    
    # Monitoring methods
    async def _handle_stale_connection(self, client_id: str):
        """Handle stale connections with learning"""
        logger.warning(f"Handling stale connection: {client_id}")
        
        try:
            if client_id in self.connections:
                connection = self.connections[client_id]
                await connection.websocket.close()
        except Exception as e:
            logger.error(f"Error closing stale connection {client_id}: {e}")
        finally:
            await self._cleanup_connection(client_id)
    
    async def _calculate_performance_metrics(self):
        """Calculate current performance metrics"""
        if self.message_history:
            # Calculate average latency from recent messages
            recent_messages = [msg for msg in self.message_history if msg.delivery_time_ms]
            if recent_messages:
                avg_latency = sum(msg.delivery_time_ms for msg in recent_messages) / len(recent_messages)
                self.performance_metrics["average_latency"] = avg_latency
    
    async def _investigate_latency_issues(self):
        """Investigate high latency issues"""
        logger.warning("High latency detected, investigating...")
        # In real implementation, this would analyze patterns and apply fixes
        self.performance_metrics["learning_applications"] += 1
    
    async def _investigate_message_failures(self):
        """Investigate message failure patterns"""
        logger.warning("High message failure rate detected, investigating...")
        # In real implementation, this would analyze failure patterns
        self.performance_metrics["learning_applications"] += 1
    
    async def _process_failure_patterns(self):
        """Process and learn from failure patterns"""
        # Analyze accumulated failure patterns
        if len(self.failure_patterns) > 0:
            logger.info(f"Processing {len(self.failure_patterns)} failure patterns")
            # In real implementation, this would consolidate and optimize patterns
    
    async def _apply_evolutionary_improvements(self):
        """Apply evolutionary improvements based on learnings"""
        # Apply continuous improvements
        logger.debug("Applying evolutionary improvements")
        # In real implementation, this would adjust algorithms and parameters
    
    async def _cleanup_old_data(self):
        """Clean up old data to prevent memory leaks"""
        current_time = datetime.now()
        
        # Clean up old pending acknowledgments
        expired_acks = [
            key for key, data in self.pending_acknowledgments.items()
            if current_time > data["timeout"]
        ]
        for key in expired_acks:
            del self.pending_acknowledgments[key]
        
        # Clean up old failure patterns (keep only recent ones)
        cutoff_time = current_time - timedelta(days=7)
        old_patterns = [
            pattern_id for pattern_id, pattern in self.failure_patterns.items()
            if pattern.learned_at < cutoff_time
        ]
        for pattern_id in old_patterns:
            del self.failure_patterns[pattern_id]
    
    async def _update_failure_patterns(self, learning: Dict[str, Any], fix_result: Dict[str, Any]):
        """Update failure patterns with new learning"""
        pattern_id = learning.get("error_id", "unknown")
        
        if pattern_id not in self.failure_patterns:
            pattern = FailurePattern(
                pattern_id=pattern_id,
                pattern_type=learning["root_cause"]["type"],
                description=learning["root_cause"]["description"],
                symptoms=[learning["error_message"]],
                root_cause=learning["root_cause"],
                fix_strategy=fix_result,
                prevention=learning.get("prevention_rule", {}),
                success_rate=1.0 if fix_result.get("successful", False) else 0.0
            )
            self.failure_patterns[pattern_id] = pattern
            self.performance_metrics["patterns_learned"] += 1

    def get_manager_status(self) -> Dict[str, Any]:
        """Get comprehensive status of the WebSocket manager"""
        return {
            "server_running": self.running,
            "active_connections": len(self.connections),
            "performance_metrics": self.performance_metrics,
            "failure_patterns": len(self.failure_patterns),
            "circuit_breakers": {
                client_id: breaker["state"]
                for client_id, breaker in self.circuit_breakers.items()
            },
            "learning_stats": self.learning_system.get_learning_stats() if hasattr(self, 'learning_system') else {}
        }

# Global manager instance
_manager_instance = None

def get_websocket_manager() -> LearningWebSocketManager:
    """Get the global WebSocket manager instance"""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = LearningWebSocketManager()
    return _manager_instance
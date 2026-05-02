"""
negotiation_socket.py — Real-time Multi-user Contract Collaboration.
Powered by FastAPI WebSockets for live redlining and chat.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import asyncio

class NegotiationManager:
    def __init__(self):
        # Room ID -> List of Active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Room ID -> Current State (redlines, etc.)
        self.room_state: Dict[str, Any] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            self.room_state[room_id] = {"redlines": {}, "messages": []}
        self.active_connections[room_id].append(websocket)
        
        # Send initial state
        await websocket.send_json({
            "type": "INIT_STATE",
            "data": self.room_state[room_id]
        })

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict, sender: WebSocket):
        """
        Send message to everyone except the sender.
        """
        if room_id in self.active_connections:
            # Update internal state if it's a redline change
            if message["type"] == "REDLINE_UPDATE":
                clause_id = message["data"]["clause_id"]
                self.room_state[room_id]["redlines"][clause_id] = message["data"]["text"]
            
            elif message["type"] == "CHAT_MESSAGE":
                self.room_state[room_id]["messages"].append(message["data"])

            for connection in self.active_connections[room_id]:
                if connection != sender:
                    await connection.send_json(message)

manager = NegotiationManager()

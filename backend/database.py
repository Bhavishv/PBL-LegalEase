"""
database.py — MongoDB connection and models for LegalEase.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/legalease")
client = AsyncIOMotorClient(MONGO_URI)
db = client.legalease

# Collections
contracts_collection = db.contracts
comments_collection = db.comments

# Basic schemas (for reference/documentation)
async def save_contract_analysis(analysis_data: dict):
    """Save analysis results to MongoDB."""
    result = await contracts_collection.insert_one(analysis_data)
    return str(result.inserted_id)

async def get_comments(contract_id: str):
    """Retrieve all comments for a specific contract."""
    cursor = comments_collection.find({"contract_id": contract_id})
    return await cursor.to_list(length=100)

async def add_comment(contract_id: str, author: str, text: str, clause_id: str = None):
    """Add a new comment to a contract or clause."""
    comment = {
        "contract_id": contract_id,
        "author": author,
        "text": text,
        "clause_id": clause_id,
        "timestamp": "Just now" # Simple for PBL
    }
    result = await comments_collection.insert_one(comment)
    return str(result.inserted_id)

"""
Seed script to populate MongoDB with sample contract data for LegalEase.
"""
import asyncio
from database import contracts_collection
from datetime import datetime

async def seed_data():
    print("Seeding database with sample contracts...")
    
    # Check if already seeded
    count = await contracts_collection.count_documents({})
    if count > 0:
        print(f"Database already has {count} contracts. Skipping seed.")
        return

    samples = [
        {
            "filename": "Gym_Membership_Agreement.pdf",
            "overall_score": 72,
            "risk_label": "Warning",
            "risk_colour": "amber",
            "total_clauses": 12,
            "high_risk_count": 1,
            "warning_count": 3,
            "safe_count": 8,
            "createdAt": datetime.now(),
            "clauses": [
                {
                    "text": "This agreement shall automatically renew for successive one-year terms.",
                    "risk_level": "high",
                    "explanation": "Auto-renewal trap detected."
                }
            ]
        },
        {
            "filename": "SaaS_Service_Agreement.docx",
            "overall_score": 92,
            "risk_label": "Safe",
            "risk_colour": "green",
            "total_clauses": 24,
            "high_risk_count": 0,
            "warning_count": 2,
            "safe_count": 22,
            "createdAt": datetime.now(),
            "clauses": []
        },
        {
            "filename": "Employment_Contract_v2.pdf",
            "overall_score": 45,
            "risk_label": "High Risk",
            "risk_colour": "red",
            "total_clauses": 18,
            "high_risk_count": 4,
            "warning_count": 5,
            "safe_count": 9,
            "createdAt": datetime.now(),
            "clauses": []
        }
    ]

    result = await contracts_collection.insert_many(samples)
    print(f"Successfully inserted {len(result.inserted_ids)} sample contracts.")

if __name__ == "__main__":
    asyncio.run(seed_data())

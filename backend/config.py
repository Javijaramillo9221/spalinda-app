import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres.psmxbbbyczfintaelryf:Lmhrs%2A2026_db@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
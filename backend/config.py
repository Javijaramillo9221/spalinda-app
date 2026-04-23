import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Ensure compatible connection string for SQLAlchemy
    SQLALCHEMY_DATABASE_URI = 'sqlite:///local.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'dev-key-petgroom'
            
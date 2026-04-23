from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    pet_name = db.Column(db.String(100), nullable=False)
    pet_type = db.Column(db.String(50), nullable=False)
    pet_details = db.Column(db.Text)
    
    appointments = db.relationship('Appointment', backref='client', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'pet_name': self.pet_name,
            'pet_type': self.pet_type,
            'pet_details': self.pet_details
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    service = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pendiente')
    was_rescheduled = db.Column(db.Boolean, default=False)
    is_reschedule_new = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'service': self.service,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'price': float(self.price),
            'client_name': self.client.name if self.client else None,
            'pet_name': self.client.pet_name if self.client else None,
            'status': self.status,
            'was_rescheduled': self.was_rescheduled,
            'is_reschedule_new': self.is_reschedule_new,
            'client_phone': self.client.phone if self.client else None
    }

class Finance(db.Model):
    __tablename__ = 'finances'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False) # 'ingreso' or 'gasto'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'amount': float(self.amount),
            'description': self.description,
            'date': self.date.isoformat() if self.date else None
        }

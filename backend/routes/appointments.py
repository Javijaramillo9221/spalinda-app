from flask import Blueprint, request, jsonify
from backend.models import db, Appointment
from datetime import datetime


appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('', methods=['GET'])
def get_appointments():
    appointments = Appointment.query.order_by(Appointment.date.desc(), Appointment.time.desc()).all()
    return jsonify([appt.to_dict() for appt in appointments])

@appointments_bp.route('', methods=['POST'])
def create_appointment():
    data = request.json
    try:
        date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
        time_obj = datetime.strptime(data['time'], '%H:%M').time()

        existing = Appointment.query.filter(
            Appointment.date == date_obj,
            Appointment.time == time_obj,
            Appointment.was_rescheduled == False
        ).first()

        if existing:
            return jsonify({'error': 'Ya hay una cita en ese horario'}), 400

        new_appointment = Appointment(
            client_id=data['client_id'],
            service=data['service'],
            date=date_obj,
            time=time_obj,
            price=data['price'],
            is_reschedule_new=data.get('is_reschedule_new', False)
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        return jsonify(new_appointment.to_dict()), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    
@appointments_bp.route('/<int:id>', methods=['DELETE'])
def delete_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    db.session.delete(appointment)
    db.session.commit()
    return jsonify({'message': 'Appointment deleted successfully'})

@appointments_bp.route('/<int:id>/complete', methods=['PUT'])
def complete_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    appointment.status = 'cumplida'
    db.session.commit()
    return jsonify({'message': 'Cita completada'})

@appointments_bp.route('/<int:id>', methods=['PUT'])
def update_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    data = request.json

    new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    new_time = datetime.strptime(data['time'], '%H:%M').time()

    existing = Appointment.query.filter(
        Appointment.date == new_date,
        Appointment.time == new_time,
        Appointment.id != id
    ).first()

    if existing:
        return jsonify({'error': 'Ya hay una cita en ese horario'}), 400

    appointment.client_id = data['client_id']
    appointment.service = data['service']
    appointment.date = new_date
    appointment.time = new_time
    appointment.price = data['price']
    appointment.was_rescheduled = True

    db.session.commit()

    return jsonify(appointment.to_dict())

@appointments_bp.route('/<int:id>/reschedule', methods=['PUT'])
def mark_rescheduled(id):
    appointment = Appointment.query.get(id)

    if not appointment:
        return jsonify({'error': 'Cita no encontrada'}), 404

    appointment.was_rescheduled = True
    db.session.commit()

    return jsonify({'message': 'Cita marcada como reagendada'})

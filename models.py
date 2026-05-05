from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # e.g. PT-000000
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    role = Column(String) # 'patient' or 'admin'
    registered_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True) # e.g. APT-1001
    serial_number = Column(Integer, unique=True, index=True) # New field
    patient_id = Column(String, index=True)
    doctor = Column(String)
    dept = Column(String)
    date = Column(String)
    time = Column(String)
    status = Column(String)
    reason = Column(String)
    booking_time = Column(DateTime, default=datetime.utcnow) # New field

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    medication = Column(String)
    dosage = Column(String)
    doctor = Column(String)
    date = Column(String)
    refills = Column(Integer, default=0)
    status = Column(String)

class Billing(Base):
    __tablename__ = "billing"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    description = Column(String)
    amount = Column(Float)
    date = Column(String)
    status = Column(String)

class DoctorCall(Base):
    __tablename__ = "doctor_calls"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    doctor = Column(String, index=True)
    call_count = Column(Integer, default=0)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime

import models
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Database
def seed_db(db: Session):
    if not db.query(models.User).first():
        db.add(models.User(id="PT-000000", first_name="Aayush", last_name="Doe", email="aayush@example.com", role="patient"))
        db.commit()
    
    if not db.query(models.Appointment).first():
        db.add_all([
            models.Appointment(id="APT-1001", serial_number=1, patient_id="PT-000000", doctor="Dr. Sarah Smith", dept="Cardiology", date="2026-03-20", time="10:00 AM", status="Confirmed", reason="Routine checkup", booking_time=datetime(2026, 3, 1, 9, 30)),
            models.Appointment(id="APT-1002", serial_number=2, patient_id="PT-000000", doctor="Dr. James Wilson", dept="Dermatology", date="2026-03-25", time="02:30 PM", status="Pending", reason="Skin rash", booking_time=datetime(2026, 3, 2, 14, 15))
        ])
        db.commit()

    if not db.query(models.Prescription).first():
        db.add_all([
            models.Prescription(id="RX-2001", patient_id="PT-000000", medication="Amoxicillin 500mg", dosage="1 tablet every 8 hours", doctor="Dr. Sarah Smith", date="2026-02-10", refills=2, status="Active"),
            models.Prescription(id="RX-2002", patient_id="PT-000000", medication="Vitamin D3", dosage="One capsule daily", doctor="Dr. Emily Davis", date="2026-01-15", refills=0, status="Completed")
        ])
        db.commit()

    if not db.query(models.Billing).first():
        db.add_all([
            models.Billing(id="INV-3001", patient_id="PT-000000", description="General Consultation", amount=150.00, date="2026-01-15", status="Unpaid"),
            models.Billing(id="INV-3002", patient_id="PT-000000", description="Blood Test", amount=85.00, date="2025-12-10", status="Paid")
        ])
        db.commit()

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_db(db)

# --- USER ENDPOINTS ---
@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    return user

# --- APPOINTMENT ENDPOINTS ---
@app.get("/appointments")
def get_appointments(patient_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Appointment)
    if patient_id:
        query = query.filter(models.Appointment.patient_id == patient_id)
    return query.all()

@app.post("/appointments")
def create_appointment(apt: Dict[Any, Any], db: Session = Depends(get_db)):
    # Generate SN
    max_sn = db.query(func.max(models.Appointment.serial_number)).scalar() or 0
    next_sn = max_sn + 1
    
    new_apt = models.Appointment(
        id=apt.get("id"),
        serial_number=next_sn,
        patient_id=apt.get("patient_id"),
        doctor=apt.get("doctor"),
        dept=apt.get("dept"),
        date=apt.get("date"),
        time=apt.get("time"),
        status=apt.get("status", "Pending"),
        reason=apt.get("reason"),
        booking_time=datetime.utcnow()
    )
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)
    return new_apt

@app.put("/appointments/{apt_id}")
def update_appointment(apt_id: str, apt: Dict[Any, Any], db: Session = Depends(get_db)):
    db_apt = db.query(models.Appointment).filter(models.Appointment.id == apt_id).first()
    if not db_apt: raise HTTPException(status_code=404)
    db_apt.patient_id = apt.get("patient_id", db_apt.patient_id)
    db_apt.doctor = apt.get("doctor", db_apt.doctor)
    db_apt.dept = apt.get("dept", db_apt.dept)
    db_apt.date = apt.get("date", db_apt.date)
    db_apt.time = apt.get("time", db_apt.time)
    db_apt.status = apt.get("status", db_apt.status)
    db_apt.reason = apt.get("reason", db_apt.reason)
    db.commit()
    db.refresh(db_apt)
    return db_apt

@app.delete("/appointments/{apt_id}")
def delete_appointment(apt_id: str, db: Session = Depends(get_db)):
    db_apt = db.query(models.Appointment).filter(models.Appointment.id == apt_id).first()
    if db_apt:
        db.delete(db_apt)
        db.commit()
        return {"success": True}
    raise HTTPException(status_code=404)

# --- PRESCRIPTION ENDPOINTS ---
@app.get("/prescriptions")
def get_prescriptions(patient_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Prescription)
    if patient_id:
        query = query.filter(models.Prescription.patient_id == patient_id)
    return query.all()

@app.post("/prescriptions")
def create_prescription(presc: Dict[Any, Any], db: Session = Depends(get_db)):
    new_presc = models.Prescription(
        id=presc.get("id"),
        patient_id=presc.get("patient_id"),
        medication=presc.get("medication"),
        doctor=presc.get("doctor"),
        dosage=presc.get("dosage"),
        refills=presc.get("refills", 0),
        date=presc.get("date"),
        status=presc.get("status", "Active")
    )
    db.add(new_presc)
    db.commit()
    db.refresh(new_presc)
    return new_presc

@app.put("/prescriptions/{presc_id}")
def update_prescription(presc_id: str, presc: Dict[Any, Any], db: Session = Depends(get_db)):
    db_presc = db.query(models.Prescription).filter(models.Prescription.id == presc_id).first()
    if not db_presc: raise HTTPException(status_code=404)
    db_presc.patient_id = presc.get("patient_id", db_presc.patient_id)
    db_presc.doctor = presc.get("doctor", db_presc.doctor)
    db_presc.medication = presc.get("medication", db_presc.medication)
    db_presc.dosage = presc.get("dosage", db_presc.dosage)
    db_presc.date = presc.get("date", db_presc.date)
    db_presc.status = presc.get("status", db_presc.status)
    db_presc.refills = presc.get("refills", db_presc.refills)
    db.commit()
    db.refresh(db_presc)
    return db_presc

@app.delete("/prescriptions/{presc_id}")
def delete_prescription(presc_id: str, db: Session = Depends(get_db)):
    db_presc = db.query(models.Prescription).filter(models.Prescription.id == presc_id).first()
    if db_presc:
        db.delete(db_presc)
        db.commit()
        return {"success": True}
    raise HTTPException(status_code=404)

# --- BILLING ENDPOINTS ---
@app.get("/billing")
def get_billing(patient_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Billing)
    if patient_id:
        query = query.filter(models.Billing.patient_id == patient_id)
    return query.all()

@app.post("/billing")
def create_billing(bill: Dict[Any, Any], db: Session = Depends(get_db)):
    new_bill = models.Billing(
        id=bill.get("id"),
        patient_id=bill.get("patient_id"),
        description=bill.get("description"),
        amount=float(bill.get("amount")),
        date=bill.get("date"),
        status=bill.get("status", "Unpaid")
    )
    db.add(new_bill)
    db.commit()
    return new_bill

@app.put("/billing/{bill_id}")
def update_billing(bill_id: str, bill: Dict[Any, Any], db: Session = Depends(get_db)):
    db_bill = db.query(models.Billing).filter(models.Billing.id == bill_id).first()
    if not db_bill: raise HTTPException(status_code=404)
    db_bill.patient_id = bill.get("patient_id", db_bill.patient_id)
    db_bill.description = bill.get("description", db_bill.description)
    db_bill.amount = float(bill.get("amount", db_bill.amount))
    db_bill.date = bill.get("date", db_bill.date)
    db_bill.status = bill.get("status", db_bill.status)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@app.delete("/billing/{bill_id}")
def delete_billing(bill_id: str, db: Session = Depends(get_db)):
    db_bill = db.query(models.Billing).filter(models.Billing.id == bill_id).first()
    if db_bill:
        db.delete(db_bill)
        db.commit()
        return {"success": True}
    raise HTTPException(status_code=404)

@app.put("/billing/pay/{patient_id}")
def pay_billing(patient_id: str, db: Session = Depends(get_db)):
    bills = db.query(models.Billing).filter(models.Billing.patient_id == patient_id, models.Billing.status == 'Unpaid').all()
    for b in bills:
        b.status = 'Paid'
    db.commit()
    return {"message": "Success"}

# --- DOCTOR CALL LIMIT ENDPOINTS ---
@app.get("/doctor-calls/{patient_id}/{doctor}")
def get_call_count(patient_id: str, doctor: str, db: Session = Depends(get_db)):
    rec = db.query(models.DoctorCall).filter(models.DoctorCall.patient_id == patient_id, models.DoctorCall.doctor == doctor).first()
    return {"call_count": rec.call_count if rec else 0}

@app.post("/doctor-calls/{patient_id}/{doctor}/increment")
def increment_call(patient_id: str, doctor: str, db: Session = Depends(get_db)):
    rec = db.query(models.DoctorCall).filter(models.DoctorCall.patient_id == patient_id, models.DoctorCall.doctor == doctor).first()
    if not rec:
        rec = models.DoctorCall(patient_id=patient_id, doctor=doctor, call_count=1)
        db.add(rec)
    else:
        rec.call_count += 1
    db.commit()
    return {"call_count": rec.call_count}

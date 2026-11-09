"""
Database Seeder for AI-Driven Organ Matching Prototype.
Populates the database with realistic synthetic data:
- 12 Donors
- 12 Organs
- 25 Waitlist Recipients
- Initial Notifications and System Benchmarks
"""

import os
import sys
import argparse
from datetime import datetime, timedelta

# Ensure project root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database.session import SessionLocal, engine, Base
from backend.app.database.models import Donor, Organ, Recipient, MatchResult, Route, Notification, ModelEvaluation
from ml.training.evaluate import load_or_compute_evaluations

def seed(reset=False):
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Avoid accidental loss of user-entered data; --reset is explicit.
        if not reset and db.query(Donor).count() >= 10:
            print("Database already contains seed data. Skipping re-seed.")
            print("Run with --reset to recreate the demonstration dataset (existing records will be removed).")
            return

        print("Clearing existing database records to recreate the demonstration dataset...")
        db.query(MatchResult).delete(synchronize_session=False)
        db.query(Notification).delete()
        db.query(Route).delete()
        db.query(Recipient).delete()
        db.query(Organ).delete()
        db.query(Donor).delete()
        db.query(ModelEvaluation).delete()
        db.commit()

        # 1. Seed Donors (12 Donors)
        donors_data = [
            {'donor_id': 'DON-101', 'age': 34, 'blood_group': 'O+', 'gender': 'Male', 'location': 'Metro Health University Medical Center', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-102', 'age': 45, 'blood_group': 'A+', 'gender': 'Female', 'location': 'Northern Regional Organ Retrieval Center', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-103', 'age': 28, 'blood_group': 'B+', 'gender': 'Male', 'location': 'Southern Cross Medical Pavilion', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-104', 'age': 52, 'blood_group': 'O-', 'gender': 'Female', 'location': 'Central Apex Specialty Hospital', 'donor_status': 'Deceased Donor'},  # Universal donor
            {'donor_id': 'DON-105', 'age': 39, 'blood_group': 'AB+', 'gender': 'Male', 'location': 'Eastern Memorial General Hospital', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-106', 'age': 61, 'blood_group': 'A-', 'gender': 'Female', 'location': 'Western Heights Medical Institute', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-107', 'age': 48, 'blood_group': 'O+', 'gender': 'Male', 'location': 'Metro Health University Medical Center', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-108', 'age': 22, 'blood_group': 'B-', 'gender': 'Female', 'location': 'Green Valley Community Hospital', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-109', 'age': 55, 'blood_group': 'A+', 'gender': 'Male', 'location': 'Northern Regional Organ Retrieval Center', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-110', 'age': 31, 'blood_group': 'O-', 'gender': 'Male', 'location': 'Southern Cross Medical Pavilion', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-111', 'age': 42, 'blood_group': 'AB-', 'gender': 'Female', 'location': 'Tri-State Medical Aviation Dispatch Hub', 'donor_status': 'Deceased Donor'},
            {'donor_id': 'DON-112', 'age': 50, 'blood_group': 'O+', 'gender': 'Male', 'location': 'Central Apex Specialty Hospital', 'donor_status': 'Deceased Donor'}
        ]

        now = datetime.utcnow()
        for d in donors_data:
            donor_obj = Donor(
                donor_id=d['donor_id'],
                age=d['age'],
                blood_group=d['blood_group'],
                gender=d['gender'],
                location=d['location'],
                donor_status=d['donor_status'],
                registration_date=now - timedelta(hours=d['age'] % 24)
            )
            db.add(donor_obj)
        db.commit()
        print(f"Seeded {len(donors_data)} Donors.")

        # 2. Seed Organs (12 Organs)
        organs_data = [
            {'organ_id': 'ORG-KID-201', 'donor_id': 'DON-101', 'organ_type': 'Kidney', 'blood_group': 'O+', 'retrieval_delta_h': 1.5, 'preservation_limit': 30.0, 'current_location': 'Metro Health University Medical Center', 'status': 'Available'},
            {'organ_id': 'ORG-LIV-202', 'donor_id': 'DON-102', 'organ_type': 'Liver', 'blood_group': 'A+', 'retrieval_delta_h': 2.0, 'preservation_limit': 12.0, 'current_location': 'Northern Regional Organ Retrieval Center', 'status': 'Available'},
            {'organ_id': 'ORG-HRT-203', 'donor_id': 'DON-104', 'organ_type': 'Heart', 'blood_group': 'O-', 'retrieval_delta_h': 0.8, 'preservation_limit': 5.0, 'current_location': 'Central Apex Specialty Hospital', 'status': 'Available'},
            {'organ_id': 'ORG-KID-204', 'donor_id': 'DON-103', 'organ_type': 'Kidney', 'blood_group': 'B+', 'retrieval_delta_h': 3.5, 'preservation_limit': 30.0, 'current_location': 'Southern Cross Medical Pavilion', 'status': 'Available'},
            {'organ_id': 'ORG-LNG-205', 'donor_id': 'DON-105', 'organ_type': 'Lung', 'blood_group': 'AB+', 'retrieval_delta_h': 1.2, 'preservation_limit': 7.0, 'current_location': 'Eastern Memorial General Hospital', 'status': 'Available'},
            {'organ_id': 'ORG-PAN-206', 'donor_id': 'DON-106', 'organ_type': 'Pancreas', 'blood_group': 'A-', 'retrieval_delta_h': 2.5, 'preservation_limit': 16.0, 'current_location': 'Western Heights Medical Institute', 'status': 'Available'},
            {'organ_id': 'ORG-KID-207', 'donor_id': 'DON-107', 'organ_type': 'Kidney', 'blood_group': 'O+', 'retrieval_delta_h': 4.0, 'preservation_limit': 30.0, 'current_location': 'Metro Health University Medical Center', 'status': 'Available'},
            {'organ_id': 'ORG-LIV-208', 'donor_id': 'DON-109', 'organ_type': 'Liver', 'blood_group': 'A+', 'retrieval_delta_h': 1.0, 'preservation_limit': 12.0, 'current_location': 'Northern Regional Organ Retrieval Center', 'status': 'Available'},
            {'organ_id': 'ORG-HRT-209', 'donor_id': 'DON-110', 'organ_type': 'Heart', 'blood_group': 'O-', 'retrieval_delta_h': 3.2, 'preservation_limit': 4.5, 'current_location': 'Southern Cross Medical Pavilion', 'status': 'Available'},
            {'organ_id': 'ORG-KID-210', 'donor_id': 'DON-112', 'organ_type': 'Kidney', 'blood_group': 'O+', 'retrieval_delta_h': 2.2, 'preservation_limit': 30.0, 'current_location': 'Central Apex Specialty Hospital', 'status': 'Available'},
            {'organ_id': 'ORG-LNG-211', 'donor_id': 'DON-108', 'organ_type': 'Lung', 'blood_group': 'B-', 'retrieval_delta_h': 1.8, 'preservation_limit': 6.5, 'current_location': 'Green Valley Community Hospital', 'status': 'Reserved for Review'},
            {'organ_id': 'ORG-LIV-212', 'donor_id': 'DON-111', 'organ_type': 'Liver', 'blood_group': 'AB-', 'retrieval_delta_h': 0.5, 'preservation_limit': 12.0, 'current_location': 'Tri-State Medical Aviation Dispatch Hub', 'status': 'Available'}
        ]

        for o in organs_data:
            organ_obj = Organ(
                organ_id=o['organ_id'],
                donor_id=o['donor_id'],
                organ_type=o['organ_type'],
                blood_group=o['blood_group'],
                retrieval_time=now - timedelta(hours=o['retrieval_delta_h']),
                preservation_limit=o['preservation_limit'],
                current_location=o['current_location'],
                status=o['status']
            )
            db.add(organ_obj)
        db.commit()
        print(f"Seeded {len(organs_data)} Organs.")

        # 3. Seed Recipients (25 Recipients)
        recipients_data = [
            {'recipient_id': 'REC-301', 'name': 'Eleanor Vance', 'age': 48, 'blood_group': 'O+', 'required_organ': 'Kidney', 'medical_urgency': 5, 'waiting_time': 840, 'hospital': 'Southern Cross Medical Pavilion', 'location': 'Southfield', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-302', 'name': 'Marcus Thorne', 'age': 56, 'blood_group': 'O+', 'required_organ': 'Kidney', 'medical_urgency': 4, 'waiting_time': 520, 'hospital': 'Metro Health University Medical Center', 'location': 'Metro City', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-303', 'name': 'Sophia Reyes', 'age': 32, 'blood_group': 'A+', 'required_organ': 'Liver', 'medical_urgency': 5, 'waiting_time': 310, 'hospital': 'Northern Regional Organ Retrieval Center', 'location': 'North Haven', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-304', 'name': 'Arthur Pendelton', 'age': 62, 'blood_group': 'O-', 'required_organ': 'Heart', 'medical_urgency': 5, 'waiting_time': 190, 'hospital': 'Central Apex Specialty Hospital', 'location': 'Midland', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-305', 'name': 'Liam Gallagher', 'age': 41, 'blood_group': 'B+', 'required_organ': 'Kidney', 'medical_urgency': 3, 'waiting_time': 680, 'hospital': 'Western Heights Medical Institute', 'location': 'Westfall', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-306', 'name': 'Aria Montgomery', 'age': 27, 'blood_group': 'AB+', 'required_organ': 'Lung', 'medical_urgency': 4, 'waiting_time': 140, 'hospital': 'Eastern Memorial General Hospital', 'location': 'Eastport', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-307', 'name': 'Jameson Cole', 'age': 53, 'blood_group': 'A-', 'required_organ': 'Liver', 'medical_urgency': 3, 'waiting_time': 450, 'hospital': 'Northern Regional Organ Retrieval Center', 'location': 'North Haven', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-308', 'name': 'Chloe Bennett', 'age': 38, 'blood_group': 'O+', 'required_organ': 'Kidney', 'medical_urgency': 2, 'waiting_time': 990, 'hospital': 'Green Valley Community Hospital', 'location': 'Green Valley', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-309', 'name': 'David Kim', 'age': 65, 'blood_group': 'B-', 'required_organ': 'Heart', 'medical_urgency': 4, 'waiting_time': 210, 'hospital': 'Southern Cross Medical Pavilion', 'location': 'Southfield', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-310', 'name': 'Maya Lin', 'age': 44, 'blood_group': 'AB-', 'required_organ': 'Liver', 'medical_urgency': 4, 'waiting_time': 380, 'hospital': 'Metro Health University Medical Center', 'location': 'Metro City', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-311', 'name': 'Robert Taylor', 'age': 51, 'blood_group': 'O+', 'required_organ': 'Pancreas', 'medical_urgency': 2, 'waiting_time': 600, 'hospital': 'Western Heights Medical Institute', 'location': 'Westfall', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-312', 'name': 'Hannah Abbott', 'age': 29, 'blood_group': 'A+', 'required_organ': 'Kidney', 'medical_urgency': 4, 'waiting_time': 410, 'hospital': 'Metro Health University Medical Center', 'location': 'Metro City', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-313', 'name': 'Victor Morales', 'age': 59, 'blood_group': 'O-', 'required_organ': 'Kidney', 'medical_urgency': 3, 'waiting_time': 750, 'hospital': 'Southern Cross Medical Pavilion', 'location': 'Southfield', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-314', 'name': 'Natalie Brooks', 'age': 35, 'blood_group': 'B+', 'required_organ': 'Liver', 'medical_urgency': 4, 'waiting_time': 290, 'hospital': 'Central Apex Specialty Hospital', 'location': 'Midland', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-315', 'name': 'Ethan Hunt', 'age': 47, 'blood_group': 'AB+', 'required_organ': 'Kidney', 'medical_urgency': 1, 'waiting_time': 320, 'hospital': 'Eastern Memorial General Hospital', 'location': 'Eastport', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-316', 'name': 'Grace Hopper', 'age': 60, 'blood_group': 'O+', 'required_organ': 'Lung', 'medical_urgency': 5, 'waiting_time': 180, 'hospital': 'Northern Regional Organ Retrieval Center', 'location': 'North Haven', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-317', 'name': 'Benjamin Sterling', 'age': 54, 'blood_group': 'A-', 'required_organ': 'Heart', 'medical_urgency': 4, 'waiting_time': 260, 'hospital': 'Central Apex Specialty Hospital', 'location': 'Midland', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-318', 'name': 'Zoe Saldana', 'age': 40, 'blood_group': 'O+', 'required_organ': 'Kidney', 'medical_urgency': 3, 'waiting_time': 580, 'hospital': 'Western Heights Medical Institute', 'location': 'Westfall', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-319', 'name': 'Lucas Scott', 'age': 23, 'blood_group': 'B+', 'required_organ': 'Heart', 'medical_urgency': 5, 'waiting_time': 95, 'hospital': 'Metro Health University Medical Center', 'location': 'Metro City', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-320', 'name': 'Isabella Ross', 'age': 67, 'blood_group': 'AB+', 'required_organ': 'Liver', 'medical_urgency': 2, 'waiting_time': 480, 'hospital': 'Southern Cross Medical Pavilion', 'location': 'Southfield', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-321', 'name': 'Daniel Craig', 'age': 49, 'blood_group': 'O-', 'required_organ': 'Pancreas', 'medical_urgency': 3, 'waiting_time': 390, 'hospital': 'Western Heights Medical Institute', 'location': 'Westfall', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-322', 'name': 'Rachel Green', 'age': 36, 'blood_group': 'A+', 'required_organ': 'Kidney', 'medical_urgency': 5, 'waiting_time': 810, 'hospital': 'Green Valley Community Hospital', 'location': 'Green Valley', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-323', 'name': 'Thomas Shelby', 'age': 43, 'blood_group': 'B-', 'required_organ': 'Kidney', 'medical_urgency': 4, 'waiting_time': 630, 'hospital': 'Eastern Memorial General Hospital', 'location': 'Eastport', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-324', 'name': 'Fiona Gallagher', 'age': 30, 'blood_group': 'O+', 'required_organ': 'Liver', 'medical_urgency': 3, 'waiting_time': 240, 'hospital': 'Central Apex Specialty Hospital', 'location': 'Midland', 'eligibility_status': 'Eligible'},
            {'recipient_id': 'REC-325', 'name': 'Samuel Jackson', 'age': 58, 'blood_group': 'AB-', 'required_organ': 'Heart', 'medical_urgency': 5, 'waiting_time': 110, 'hospital': 'Metro Health University Medical Center', 'location': 'Metro City', 'eligibility_status': 'Suspended'}
        ]

        for r in recipients_data:
            rec_obj = Recipient(
                recipient_id=r['recipient_id'],
                name=r['name'],
                age=r['age'],
                blood_group=r['blood_group'],
                required_organ=r['required_organ'],
                medical_urgency=r['medical_urgency'],
                waiting_time=r['waiting_time'],
                hospital=r['hospital'],
                location=r['location'],
                eligibility_status=r['eligibility_status'],
                registration_date=now - timedelta(days=r['waiting_time'])
            )
            db.add(rec_obj)
        db.commit()
        print(f"Seeded {len(recipients_data)} Recipients.")

        # 4. Seed Initial Automated Notifications
        notifications_data = [
            {'type': 'ORGAN_REGISTERED', 'message': 'New donor kidney ORG-KID-201 (O+) available at Metro Health. Cold preservation window: 30 hours.', 'severity': 'INFO'},
            {'type': 'PRESERVATION_WARNING', 'message': 'Organ ORG-HRT-209 (Heart) at Southern Cross has only 1.3 hours remaining in safe preservation window.', 'severity': 'CRITICAL'},
            {'type': 'HIGH_URGENCY_RECIPIENT', 'message': 'Critical tier-5 candidate registered: Eleanor Vance (Kidney, O+) at Southern Cross Pavilion.', 'severity': 'WARNING'},
            {'type': 'LOGISTICS_ALERT', 'message': 'Air ambulance dispatch corridor HUB-AIR-01 to HOSP-CENTRAL-04 active for rapid cardiac transit.', 'severity': 'INFO'},
            {'type': 'MATCH_IDENTIFIED', 'message': 'Automated compatibility analysis identified 5 potential candidates for Organ ORG-LIV-202.', 'severity': 'INFO'}
        ]

        for idx, n in enumerate(notifications_data, start=1):
            notif_obj = Notification(
                notification_id=f"NOTIF-{idx + 100:03d}",
                type=n['type'],
                message=n['message'],
                severity=n['severity'],
                status='UNREAD',
                created_at=now - timedelta(minutes=15 * idx)
            )
            db.add(notif_obj)
        db.commit()
        print(f"Seeded {len(notifications_data)} Notifications.")

        # 5. Seed Model Evaluations
        eval_payload = load_or_compute_evaluations()
        if 'metrics' in eval_payload:
            for m_name, m_val in eval_payload['metrics'].items():
                db.add(ModelEvaluation(
                    evaluation_id=f"EVAL-{m_name[:3].upper()}",
                    model_name=m_name,
                    accuracy=m_val['accuracy'],
                    precision=m_val['precision'],
                    recall=m_val['recall'],
                    f1_score=m_val['f1_score'],
                    roc_auc=m_val['roc_auc']
                ))
            db.commit()
            print("Seeded model evaluation benchmarks.")

        print("\nDatabase seeding completed successfully!")
    finally:
        db.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Create or reset the synthetic organ matching demo dataset.")
    parser.add_argument("--reset", action="store_true", help="Delete existing database records and recreate the demo dataset.")
    seed(reset=parser.parse_args().reset)

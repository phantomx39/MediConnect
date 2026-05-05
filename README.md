# MediConnect - Healthcare Management System

## Description
MediConnect is a streamlined, full-stack healthcare management system designed to bridge the gap between patients and hospital administrators. It provides a unified digital platform where patients can effortlessly book appointments, access prescriptions, view billing details, and request doctor callbacks. For hospital staff, it offers a robust administrative dashboard to manage patient records, monitor operations, and oversee daily hospital activities. Built with a high-performance FastAPI backend and a responsive vanilla JavaScript frontend, MediConnect aims to make healthcare administration efficient and accessible.

## Features

- **Patient Dashboard**: View appointments, prescriptions, billing information, and request doctor calls.
- **Admin Dashboard**: Manage hospital operations, view patient records, and handle administrative tasks.
- **RESTful API**: Fast and scalable API built using FastAPI.
- **Database Management**: SQLAlchemy ORM for seamless SQLite database interactions.

## Technology Stack

### Backend
- **Python 3.8+**
- **FastAPI**: High-performance web framework for building APIs.
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapper.
- **Uvicorn**: ASGI web server implementation.
- **SQLite**: Lightweight database for storing application data.

### Frontend
- **HTML5, CSS3, JavaScript (Vanilla)**: For a responsive and dynamic user interface.

## Project Files Overview

- `main.py`: FastAPI application and endpoints.
- `models.py`: SQLAlchemy database models.
- `database.py`: Database connection and session management.
- `hospital.db`: SQLite database file (generated automatically).
- `requirements.txt`: Python dependencies.
- Frontend HTML/CSS/JS files: `index.html`, `dashboard.html`, `admin.html`, `register.html`, etc.

## Installation & Setup

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd SEPM
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**:
   - **Windows**:
     ```bash
     .venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`. You can view the interactive API documentation at `http://127.0.0.1:8000/docs`.

6. **Access the Frontend**:
   Simply open `index.html` or `dashboard.html` in your web browser. Ensure the backend server is running so the frontend can fetch data via the API.

## Usage

- The database will automatically seed with some initial mock data (e.g., patient "PT-000000", sample appointments, prescriptions, and bills) on the first run.
- Use the **Patient Dashboard** (`dashboard.html`) to interact with the system as a patient.
- Use the **Admin Login** (`admin-login.html`) to access the admin dashboard.

## License

This project is open-source and available under the MIT License.

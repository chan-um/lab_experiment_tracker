# Backend Integration Setup Guide

## Overview
The React frontend is now connected to the Flask backend for persistent data storage. All experiments and user authentication are stored in a SQLite database.

## Setup Instructions

### 1. Install Python Dependencies

Install the required Python packages:

```bash
pip install flask-cors
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 2. Start the Flask Backend

Run the Flask server:

```bash
python app.py
```

The backend will start on `http://localhost:5000`

### 3. Start the React Frontend

In a separate terminal, navigate to the React app directory and start it:

```bash
cd my-lab-app
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

## Database

- **Location**: `instance/database.db` (SQLite database)
- **Models**: 
  - `User` - Stores user accounts with hashed passwords
  - `Experiment` - Stores experiment data
  - `ExperimentLog` - Stores log entries for experiments
  - `Profile` - Legacy model (for existing templates)

The database is automatically created when you first run `app.py`.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/me` - Get current user

### Experiments
- `GET /api/experiments` - Get all experiments for current user
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments/<id>` - Get experiment by ID
- `PUT /api/experiments/<id>` - Update experiment
- `DELETE /api/experiments/<id>` - Delete experiment
- `POST /api/experiments/<id>/logs` - Add log entry to experiment

## Features

✅ **User Authentication**
- Register new accounts
- Login with email/password
- Session-based authentication
- Password hashing with Werkzeug

✅ **Experiment Management**
- Create, read, update, delete experiments
- Add log entries
- Update status and analysis
- All data persisted to database

✅ **Data Persistence**
- All experiments saved to SQLite database
- Data persists across page refreshes
- User-specific data isolation

## Notes

- The backend uses Flask sessions for authentication (cookies)
- CORS is enabled for `localhost:5173` and `localhost:3000`
- Passwords are hashed using Werkzeug's security functions
- Each user only sees their own experiments

## Troubleshooting

1. **CORS errors**: Make sure `flask-cors` is installed
2. **Database errors**: Delete `instance/database.db` and restart the Flask server to recreate it
3. **Connection errors**: Ensure Flask backend is running on port 5000
4. **Session issues**: Clear browser cookies if authentication isn't working


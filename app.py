from flask import Flask, render_template, request, redirect, url_for, jsonify, session, send_from_directory
from flask_scss import Scss
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import Index, event, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url
import os
import json
import uuid
import re

app = Flask(__name__)

# Configuration from environment variables (with defaults for local development)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Database configuration
# Supports both SQLite (default for local dev) and PostgreSQL (for production/Cloud SQL)
# 
# For local development: No DATABASE_URL needed - uses SQLite automatically
# For production/Cloud SQL: Set DATABASE_URL environment variable
#   PostgreSQL format: postgresql://labdb:0108@/dbname?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
database_uri = os.environ.get('DATABASE_URL')
if not database_uri:
    # Default to SQLite for local development (no setup required)
    # Google Cloud Run uses /tmp for writable directories
    if os.environ.get('GAE_ENV') or os.environ.get('CLOUD_RUN'):
        database_uri = 'sqlite:////tmp/database.db'
    else:
        database_uri = 'sqlite:///database.db'

app.config['SQLALCHEMY_DATABASE_URI'] = database_uri

# Google Cloud Run uses /tmp for writable directories (for uploads)
if os.environ.get('GAE_ENV') or os.environ.get('CLOUD_RUN'):
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'

# Database isolation level configuration
# SQLite: None = SERIALIZABLE (default, safest)
# PostgreSQL: Supports READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
is_using_postgres = database_uri.startswith('postgresql://')
if is_using_postgres:
    # PostgreSQL configuration
    isolation_level = os.environ.get('DB_ISOLATION_LEVEL', 'READ COMMITTED')
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'isolation_level': isolation_level,
        'pool_size': int(os.environ.get('DB_POOL_SIZE', '10')),
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', '20')),
        'pool_pre_ping': True,
        'pool_recycle': 3600,
    }
else:
    # SQLite configuration
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'isolation_level': None,  # SERIALIZABLE for SQLite
    }

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# CORS configuration - allow frontend origin from environment variable
allowed_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

# Session cookie configuration for cross-origin requests
# Secure=True is required for SameSite=None in production (HTTPS)
# For local development (HTTP), we need Secure=False
is_production = os.environ.get('GAE_ENV') or os.environ.get('CLOUD_RUN') or os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = is_production  # True for HTTPS (production), False for HTTP (local)
app.config['SESSION_COOKIE_HTTPONLY'] = True

db = SQLAlchemy(app)

# Database-specific connection configuration
@event.listens_for(Engine, "connect")
def set_db_pragma(dbapi_conn, connection_record):
    """Configure database connection with optimizations"""
    # Only configure SQLite (PostgreSQL doesn't need PRAGMA statements)
    try:
        url = make_url(database_uri)
        is_sqlite = url.drivername.startswith('sqlite')
    except Exception:
        # Fallback in case parsing fails
        is_sqlite = database_uri.startswith('sqlite:')

    if is_sqlite:
        cursor = dbapi_conn.cursor()
        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Input Validation Helpers
def validate_email(email):
    """Validate email format to prevent injection and ensure proper format"""
    if not email or not isinstance(email, str):
        return False
    # Basic email validation pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 200

def validate_alphanumeric_code(code, min_len=1, max_len=20):
    """Validate alphanumeric codes (e.g., group codes)"""
    if not code or not isinstance(code, str):
        return False
    # Allow only alphanumeric characters
    return code.isalnum() and min_len <= len(code) <= max_len

def validate_experiment_id(exp_id):
    """Validate experiment ID format"""
    if not exp_id or not isinstance(exp_id, str):
        return False
    # Allow alphanumeric, hyphens, and underscores, max 50 chars
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, exp_id)) and len(exp_id) <= 50

def sanitize_string_input(value, max_length=500):
    """Sanitize string input by trimming and limiting length"""
    if not isinstance(value, str):
        return None
    return value.strip()[:max_length] if value else None

# Database Models
class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)  # Join code
    created_by_id = db.Column(db.Integer, nullable=False)  # Will reference User.id
    date_created = db.Column(db.DateTime, default=datetime.now)
    
    members = db.relationship('GroupMember', backref='group', lazy=True, cascade='all, delete-orphan')
    
    # Index for foreign key used in queries
    __table_args__ = (
        Index('idx_group_created_by', 'created_by_id'),  # For queries filtering by created_by_id
    )
    
    def to_dict(self):
        creator = User.query.get(self.created_by_id) if self.created_by_id else None
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'createdBy': creator.name if creator else 'Unknown',
            'memberCount': len(self.members),
            'dateCreated': self.date_created.isoformat() if self.date_created else None
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now)
    current_group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    
    experiments = db.relationship('Experiment', backref='owner_user', lazy=True)
    group_memberships = db.relationship('GroupMember', backref='user', lazy=True, cascade='all, delete-orphan')
    
    # Index for foreign key used in queries
    __table_args__ = (
        Index('idx_user_current_group', 'current_group_id'),  # For queries filtering by current_group_id
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'currentGroupId': self.current_group_id
        }

class Experiment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exp_id = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Planning')
    start_date = db.Column(db.String(50), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    hypothesis = db.Column(db.Text, nullable=True)
    protocol = db.Column(db.Text, nullable=True)
    analysis = db.Column(db.Text, nullable=True, default='')
    date_created = db.Column(db.DateTime, default=datetime.now)
    
    logs = db.relationship('ExperimentLog', backref='experiment', lazy=True, cascade='all, delete-orphan', order_by='ExperimentLog.timestamp')
    files = db.relationship('ExperimentFile', backref='experiment', lazy=True, cascade='all, delete-orphan', order_by='ExperimentFile.date_created')
    
    # Indexes for frequently queried columns
    __table_args__ = (
        Index('idx_experiment_owner', 'owner_id'),  # For queries filtering by owner_id
        Index('idx_experiment_owner_exp', 'owner_id', 'exp_id'),  # Composite index for common query pattern
        Index('idx_experiment_status', 'status'),  # For filtering by status
    )
    
    def to_dict(self):
        return {
            'id': self.exp_id,
            'title': self.title,
            'status': self.status,
            'startDate': self.start_date,
            'owner': self.owner_user.name if self.owner_user else 'Unknown',
            'ownerId': self.owner_user.id if self.owner_user else None,
            'hypothesis': self.hypothesis or '',
            'protocol': self.protocol or '',
            'analysis': self.analysis or '',
            'logs': [log.to_dict() for log in self.logs],
            'files': [file.to_dict() for file in self.files]
        }

class ExperimentLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.id'), nullable=False)
    timestamp = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now)
    
    # Index for frequently queried foreign key
    __table_args__ = (
        Index('idx_experiment_log_experiment', 'experiment_id'),  # For queries filtering by experiment_id
    )
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'content': self.content
        }

class ExperimentFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.id'), nullable=False)
    filename = db.Column(db.String(500), nullable=False)
    original_filename = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(1000), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.now)
    
    # Indexes for frequently queried columns
    __table_args__ = (
        Index('idx_experiment_file_experiment', 'experiment_id'),  # For queries filtering by experiment_id
        Index('idx_experiment_file_composite', 'experiment_id', 'id'),  # Composite index for common query pattern
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.original_filename,
            'fileSize': self.file_size,
            'mimeType': self.mime_type,
            'dateCreated': self.date_created.isoformat() if self.date_created else None
        }

class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_joined = db.Column(db.DateTime, default=datetime.now)
    
    # Unique constraint already creates an index, but we add separate indexes for individual columns
    # since queries often filter by just user_id or just group_id
    __table_args__ = (
        db.UniqueConstraint('group_id', 'user_id', name='unique_group_member'),
        Index('idx_group_member_user', 'user_id'),  # For queries filtering by user_id
        Index('idx_group_member_group', 'group_id'),  # For queries filtering by group_id
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'groupId': self.group_id,
            'userId': self.user_id,
            'userName': self.user.name if self.user else 'Unknown',
            'dateJoined': self.date_joined.isoformat() if self.date_joined else None
        }

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(200), nullable=False)
    last_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f"Name: {self.first_name} {self.last_name}"

# API Routes

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password')
    name = data.get('name', email.split('@')[0] if email else 'User')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Validate email format to prevent injection
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password length
    if len(password) < 6 or len(password) > 200:
        return jsonify({'error': 'Password must be between 6 and 200 characters'}), 400
    
    # Sanitize name
    if name:
        name = sanitize_string_input(name, max_length=200) or 'User'
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400
    
    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name
    )
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    return jsonify({'message': 'User created successfully', 'user': user.to_dict()}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Validate email format to prevent injection
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    session['user_id'] = user.id
    return jsonify({'message': 'Login successful', 'user': user.to_dict()}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@app.route('/api/me', methods=['PUT'])
def update_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update name if provided
    if 'name' in data:
        user.name = data['name']
    
    # Update email if provided (check for uniqueness)
    if 'email' in data:
        new_email = data.get('email', '').strip()
        if not validate_email(new_email):
            return jsonify({'error': 'Invalid email format'}), 400
        if new_email != user.email:
            if User.query.filter_by(email=new_email).first():
                return jsonify({'error': 'Email already in use'}), 400
            user.email = new_email
    
    # Update password if provided
    if 'password' in data and data['password']:
        user.password_hash = generate_password_hash(data['password'])
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

# Group Routes
@app.route('/api/groups', methods=['GET'])
def get_groups():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get all groups the user is a member of
    memberships = GroupMember.query.filter_by(user_id=user_id).all()
    groups = [membership.group for membership in memberships]
    return jsonify({'groups': [group.to_dict() for group in groups]}), 200

@app.route('/api/groups', methods=['POST'])
def create_group():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({'error': 'Group name is required'}), 400
    
    # Generate unique join code
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    while Group.query.filter_by(code=code).first():
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    group = Group(
        name=name,
        code=code,
        created_by_id=user_id
    )
    db.session.add(group)
    db.session.flush()  # Get the group ID
    
    # Add creator as member
    member = GroupMember(group_id=group.id, user_id=user_id)
    db.session.add(member)
    
    # Set as user's current group
    user = User.query.get(user_id)
    user.current_group_id = group.id
    
    db.session.commit()
    return jsonify({'group': group.to_dict()}), 201

@app.route('/api/groups/join', methods=['POST'])
def join_group():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    code = data.get('code', '').strip().upper()
    
    if not code:
        return jsonify({'error': 'Group code is required'}), 400
    
    # Validate group code format to prevent injection
    if not validate_alphanumeric_code(code, min_len=6, max_len=6):
        return jsonify({'error': 'Invalid group code format'}), 400
    
    group = Group.query.filter_by(code=code).first()
    if not group:
        return jsonify({'error': 'Invalid group code'}), 404
    
    # Check if already a member
    existing_member = GroupMember.query.filter_by(group_id=group.id, user_id=user_id).first()
    if existing_member:
        return jsonify({'error': 'You are already a member of this group'}), 400
    
    # Add user to group
    member = GroupMember(group_id=group.id, user_id=user_id)
    db.session.add(member)
    
    # Set as user's current group
    user = User.query.get(user_id)
    user.current_group_id = group.id
    
    db.session.commit()
    return jsonify({'group': group.to_dict()}), 200

@app.route('/api/groups/<int:group_id>/leave', methods=['POST'])
def leave_group(group_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'You are not a member of this group'}), 404
    
    # Remove membership
    db.session.delete(member)
    
    # Clear current group if it was this group
    user = User.query.get(user_id)
    if user.current_group_id == group_id:
        user.current_group_id = None
    
    db.session.commit()
    return jsonify({'message': 'Left group successfully'}), 200

@app.route('/api/groups/<int:group_id>/select', methods=['POST'])
def select_group(group_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Verify user is a member
    member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'You are not a member of this group'}), 403
    
    # Set as current group
    user = User.query.get(user_id)
    user.current_group_id = group_id
    db.session.commit()
    
    return jsonify({'message': 'Group selected successfully', 'group': member.group.to_dict()}), 200

@app.route('/api/groups/current', methods=['GET'])
def get_current_group():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.current_group_id:
        return jsonify({'group': None}), 200
    
    group = Group.query.get(user.current_group_id)
    if not group:
        return jsonify({'group': None}), 200
    
    return jsonify({'group': group.to_dict()}), 200

@app.route('/api/groups/current/members', methods=['GET'])
def get_current_group_members():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.current_group_id:
        return jsonify({'members': []}), 200
    
    group = Group.query.get(user.current_group_id)
    if not group:
        return jsonify({'members': []}), 200
    
    members = GroupMember.query.filter_by(group_id=group.id).all()
    return jsonify({'members': [member.to_dict() for member in members]}), 200

# Experiment Routes
@app.route('/api/experiments', methods=['GET'])
def get_experiments():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if scope query parameter is provided
    scope = request.args.get('scope', 'user')  # Default to 'user'
    
    if scope == 'group':
        # Get user's own experiments
        experiments = Experiment.query.filter_by(owner_id=user_id).all()
        all_experiment_ids = {exp.id for exp in experiments}
        
        # Get all groups the user is a member of
        memberships = GroupMember.query.filter_by(user_id=user_id).all()
        
        # Get experiments from all group members across all groups
        for membership in memberships:
            group = Group.query.get(membership.group_id)
            if group:
                # Get all member user IDs in this group
                member_ids = [member.user_id for member in group.members]
                # Get experiments from all group members
                group_experiments = Experiment.query.filter(Experiment.owner_id.in_(member_ids)).all()
                # Combine and deduplicate
                for exp in group_experiments:
                    if exp.id not in all_experiment_ids:
                        experiments.append(exp)
                        all_experiment_ids.add(exp.id)
    else:
        # Get only user's own experiments (default)
        experiments = Experiment.query.filter_by(owner_id=user_id).all()
    
    # Return experiments list directly (not wrapped in 'experiments' key)
    experiments_list = [exp.to_dict() for exp in experiments]
    return jsonify(experiments_list), 200

@app.route('/api/experiments', methods=['POST'])
def create_experiment():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    # Generate unique experiment ID
    exp_id = data.get('id') or f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Validate experiment ID format if provided by user
    if exp_id and not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    # Check if ID already exists
    if Experiment.query.filter_by(exp_id=exp_id).first():
        exp_id = f"{exp_id}-{datetime.now().strftime('%S')}"
    
    experiment = Experiment(
        exp_id=exp_id,
        title=data.get('title', ''),
        status=data.get('status', 'Planning'),
        start_date=data.get('startDate', datetime.now().strftime('%Y-%m-%d')),
        owner_id=user_id,
        hypothesis=data.get('hypothesis', ''),
        protocol=data.get('protocol', ''),
        analysis=data.get('analysis', '')
    )
    
    db.session.add(experiment)
    db.session.commit()
    
    return jsonify({'experiment': experiment.to_dict()}), 201

@app.route('/api/experiments/<exp_id>', methods=['GET'])
def get_experiment(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    # First check if user owns the experiment
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    
    # If not found, check if it belongs to a group member
    if not experiment:
        # Get all groups the user is a member of
        memberships = GroupMember.query.filter_by(user_id=user_id).all()
        member_ids = {user_id}  # Include user's own ID
        
        for membership in memberships:
            group = Group.query.get(membership.group_id)
            if group:
                # Get all member user IDs in this group
                for member in group.members:
                    member_ids.add(member.user_id)
        
        # Try to find experiment owned by any group member
        experiment = Experiment.query.filter(
            Experiment.exp_id == exp_id,
            Experiment.owner_id.in_(member_ids)
        ).first()
    
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    return jsonify({'experiment': experiment.to_dict()}), 200

@app.route('/api/experiments/<exp_id>', methods=['PUT'])
def update_experiment(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        experiment.title = data['title']
    if 'status' in data:
        experiment.status = data['status']
    if 'hypothesis' in data:
        experiment.hypothesis = data['hypothesis']
    if 'protocol' in data:
        experiment.protocol = data['protocol']
    if 'analysis' in data:
        experiment.analysis = data['analysis']
    if 'logs' in data:
        # Replace all logs
        ExperimentLog.query.filter_by(experiment_id=experiment.id).delete()
        for log_data in data['logs']:
            log = ExperimentLog(
                experiment_id=experiment.id,
                timestamp=log_data['timestamp'],
                content=log_data['content']
            )
            db.session.add(log)
    
    db.session.commit()
    return jsonify({'experiment': experiment.to_dict()}), 200

@app.route('/api/experiments/<exp_id>', methods=['DELETE'])
def delete_experiment(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    db.session.delete(experiment)
    db.session.commit()
    
    return jsonify({'message': 'Experiment deleted successfully'}), 200

@app.route('/api/experiments/<exp_id>/logs', methods=['POST'])
def add_log(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    data = request.get_json()
    log = ExperimentLog(
        experiment_id=experiment.id,
        timestamp=data.get('timestamp', datetime.now().strftime('%Y-%m-%d %I:%M %p')),
        content=data.get('content', '')
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'log': log.to_dict(), 'experiment': experiment.to_dict()}), 201

# File Upload Routes
@app.route('/api/experiments/<exp_id>/files', methods=['POST'])
def upload_file(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Generate unique filename
    original_filename = secure_filename(file.filename)
    file_ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Save file
    file.save(file_path)
    file_size = os.path.getsize(file_path)
    
    # Get MIME type
    mime_type = file.content_type or 'application/octet-stream'
    
    # Create database record
    experiment_file = ExperimentFile(
        experiment_id=experiment.id,
        filename=unique_filename,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type
    )
    
    db.session.add(experiment_file)
    db.session.commit()
    
    return jsonify({'file': experiment_file.to_dict(), 'experiment': experiment.to_dict()}), 201

@app.route('/api/experiments/<exp_id>/files/<int:file_id>', methods=['DELETE'])
def delete_file(exp_id, file_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    experiment_file = ExperimentFile.query.filter_by(id=file_id, experiment_id=experiment.id).first()
    if not experiment_file:
        return jsonify({'error': 'File not found'}), 404
    
    # Delete physical file
    if os.path.exists(experiment_file.file_path):
        os.remove(experiment_file.file_path)
    
    db.session.delete(experiment_file)
    db.session.commit()
    
    return jsonify({'message': 'File deleted successfully', 'experiment': experiment.to_dict()}), 200

@app.route('/api/experiments/<exp_id>/files/<int:file_id>/download', methods=['GET'])
def download_file(exp_id, file_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Validate experiment ID format to prevent injection
    if not validate_experiment_id(exp_id):
        return jsonify({'error': 'Invalid experiment ID format'}), 400
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    experiment_file = ExperimentFile.query.filter_by(id=file_id, experiment_id=experiment.id).first()
    if not experiment_file:
        return jsonify({'error': 'File not found'}), 404
    
    return send_from_directory(
        app.config['UPLOAD_FOLDER'],
        experiment_file.filename,
        as_attachment=True,
        download_name=experiment_file.original_filename
    )

# ========== Legacy Routes (for existing templates) ==========

@app.route('/')
def index():
    print(f"Current working directory: {os.getcwd()}")
    print(f"Templates folder: {app.template_folder}")
    print(f"Templates exist: {os.path.exists('templates/index.html')}")
    profiles = Profile.query.all()
    return render_template('index.html', profiles=profiles)

@app.route('/add_data')
def add_data():
    return render_template('add_profile.html')

@app.route('/add', methods=['POST'])
def add():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    print(first_name, last_name, email)

    if first_name and last_name and email:
        new_profile = Profile(first_name=first_name, last_name=last_name, email=email)
        db.session.add(new_profile)
        db.session.commit()
        return redirect(url_for('index'))
    else:
        return "Please enter a valid name and email"

@app.route('/delete/<int:id>')
def delete(id):
    data = Profile.query.get(id)
    db.session.delete(data)
    db.session.commit()
    return redirect(url_for('index'))

def migrate_database():
    """Add missing columns and indexes to existing database tables"""
    from sqlalchemy import inspect, text
    
    inspector = inspect(db.engine)
    db_dialect = db.engine.dialect.name
    
    # Check if user table exists and if current_group_id column is missing
    if 'user' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('user')]
        if 'current_group_id' not in columns:
            print("Adding current_group_id column to user table...")
            with db.engine.connect() as conn:
                # PostgreSQL uses different syntax for ALTER TABLE
                if db_dialect == 'postgresql':
                    conn.execute(text("ALTER TABLE \"user\" ADD COLUMN current_group_id INTEGER"))
                else:
                    conn.execute(text("ALTER TABLE user ADD COLUMN current_group_id INTEGER"))
                conn.commit()
            print("Migration completed: Added current_group_id column")
    
    # Create indexes if they don't exist
    print("Creating database indexes...")
    indexes_to_create = [
        # Experiment indexes
        ("idx_experiment_owner", "experiment", "owner_id"),
        ("idx_experiment_owner_exp", "experiment", "owner_id, exp_id"),
        ("idx_experiment_status", "experiment", "status"),
        # ExperimentLog indexes
        ("idx_experiment_log_experiment", "experiment_log", "experiment_id"),
        # ExperimentFile indexes
        ("idx_experiment_file_experiment", "experiment_file", "experiment_id"),
        ("idx_experiment_file_composite", "experiment_file", "experiment_id, id"),
        # GroupMember indexes
        ("idx_group_member_user", "group_member", "user_id"),
        ("idx_group_member_group", "group_member", "group_id"),
        # User indexes
        ("idx_user_current_group", "user", "current_group_id"),
        # Group indexes
        ("idx_group_created_by", "group", "created_by_id"),
    ]
    
    existing_indexes = []
    try:
        with db.engine.connect() as conn:
            if db_dialect == 'postgresql':
                # PostgreSQL: query pg_indexes system catalog
                result = conn.execute(text("""
                    SELECT indexname FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND indexname NOT LIKE 'pg_%'
                """))
            else:
                # SQLite: query sqlite_master
                result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"))
            existing_indexes = [row[0] for row in result]
    except Exception as e:
        print(f"Warning: Could not check existing indexes: {e}")
    
    created_count = 0
    for index_name, table_name, columns in indexes_to_create:
        if index_name not in existing_indexes:
            try:
                with db.engine.connect() as conn:
                    # PostgreSQL requires quotes around table names that are reserved words
                    if db_dialect == 'postgresql':
                        # Quote table names for PostgreSQL
                        quoted_table = f'"{table_name}"' if table_name in ['user', 'group'] else table_name
                        conn.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {quoted_table} ({columns})"))
                    else:
                        conn.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({columns})"))
                    conn.commit()
                created_count += 1
                print(f"  Created index: {index_name}")
            except Exception as e:
                print(f"  Warning: Could not create index {index_name}: {e}")
    
    if created_count > 0:
        print(f"Index migration completed: Created {created_count} indexes")
    else:
        print("All indexes already exist")

# Initialize database tables on startup (runs for both local and Cloud Run/gunicorn)
# This runs when the module is imported, which happens before gunicorn starts the app
with app.app_context():
    try:
        db.create_all()
        migrate_database()
        print("✅ Database tables initialized successfully")
    except Exception as e:
        print(f"⚠️ Warning: Database initialization error: {e}")
        # Don't fail startup - tables might already exist or connection might fail

if __name__ == '__main__':
    # Get port from environment variable (required for Cloud Run)
    port = int(os.environ.get('PORT', 5000))
    # Disable debug mode in production
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=port)

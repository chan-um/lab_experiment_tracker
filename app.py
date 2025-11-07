from flask import Flask, render_template, request, redirect, url_for, jsonify, session, send_from_directory
from flask_scss import Scss
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import json
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enable CORS for React app
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"], supports_credentials=True)

db = SQLAlchemy(app)

# Database Models
class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)  # Join code
    created_by_id = db.Column(db.Integer, nullable=False)  # Will reference User.id
    date_created = db.Column(db.DateTime, default=datetime.now)
    
    members = db.relationship('GroupMember', backref='group', lazy=True, cascade='all, delete-orphan')
    
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
    
    def to_dict(self):
        return {
            'id': self.exp_id,
            'title': self.title,
            'status': self.status,
            'startDate': self.start_date,
            'owner': self.owner_user.name if self.owner_user else 'Unknown',
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
    
    __table_args__ = (db.UniqueConstraint('group_id', 'user_id', name='unique_group_member'),)
    
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

# ========== API Routes ==========

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', email.split('@')[0] if email else 'User')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
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
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
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
        new_email = data['email']
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
    
    experiment = Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    
    return jsonify({'experiment': experiment.to_dict()}), 200

@app.route('/api/experiments/<exp_id>', methods=['PUT'])
def update_experiment(exp_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
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
    """Add missing columns to existing database tables"""
    from sqlalchemy import inspect, text
    
    inspector = inspect(db.engine)
    
    # Check if user table exists and if current_group_id column is missing
    if 'user' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('user')]
        if 'current_group_id' not in columns:
            print("Adding current_group_id column to user table...")
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE user ADD COLUMN current_group_id INTEGER"))
                conn.commit()
            print("Migration completed: Added current_group_id column")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        migrate_database()
    app.run(debug=True, port=5000)

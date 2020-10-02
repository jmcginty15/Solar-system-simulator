from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def connect_db(app):
    """Connect to database."""

    db.app = app
    db.init_app(app)

class System(db.Model):
    """System"""

    __tablename__ = 'Systems'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False, unique=True)

    def __repr__(self):
        return f'<System name: {self.name}>'

    def mass(self):
        """Calculate total mass of system"""
        tot_mass = 0
        for obj in self.objects:
            tot_mass += obj.mass
        return tot_mass
    
    def barycenter(self, objects):
        """Calculate the position and velocity of the system barycenter relative to the solar system barycenter"""
        sys_mass = self.mass()

        x_pos = sum([obj['position'][0] * obj['mass'] for obj in objects]) / sys_mass
        y_pos = sum([obj['position'][1] * obj['mass'] for obj in objects]) / sys_mass
        z_pos = sum([obj['position'][2] * obj['mass'] for obj in objects]) / sys_mass

        x_vel = sum([obj['velocity'][0] * obj['mass'] for obj in objects]) / sys_mass
        y_vel = sum([obj['velocity'][1] * obj['mass'] for obj in objects]) / sys_mass
        z_vel = sum([obj['velocity'][2] * obj['mass'] for obj in objects]) / sys_mass

        return {'position': [x_pos, y_pos, z_pos], 'velocity': [x_vel, y_vel, z_vel]}

class Object(db.Model):
    """Object"""

    __tablename__ = 'Objects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True)
    designation = db.Column(db.String(), unique=True)
    obj_type = db.Column(db.String(), nullable=False)
    sat_type = db.Column(db.String())
    mass = db.Column(db.Float)
    radius_x = db.Column(db.Float)
    radius_y = db.Column(db.Float)
    radius_z = db.Column(db.Float)
    system_id = db.Column(db.Integer, db.ForeignKey('Systems.id'), nullable=True)
    system = db.relationship('System', backref='objects')

    def __repr__(self):
        return f'<Object id: {self.id}, name: {self.name}, designation: {self.designation}, obj_type: {self.obj_type}, sat_type: {self.sat_type}, system: {self.system.name}, alt_names: {[name.name for name in self.alt_names]}, mass: {self.mass}, radius_x: {self.radius_x}, radius_y: {self.radius_y}, radius_z: {self.radius_z}>'

class AltName(db.Model):
    """Alternate names"""

    __tablename__ = 'Alt-Names'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(), nullable=False)
    obj_id = db.Column(db.Integer, db.ForeignKey('Objects.id'))
    obj = db.relationship('Object', backref='alt_names')

    def __repr__(self):
        return f'<AltName name: {self.name}>'
        
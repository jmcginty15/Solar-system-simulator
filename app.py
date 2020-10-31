from flask import Flask, request, render_template, redirect, flash, jsonify, send_file
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, System, Object, AltName
from functions import get_obj_batch, get_obj_vectors, get_id_list
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yeet'
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///solar_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

debug = DebugToolbarExtension(app)
connect_db(app)
db.create_all()

@app.route('/')
def home():
    return render_template('base.html')

@app.route('/bodies/<int:obj_id>')
def get_object(obj_id):
    year = int(request.args['year'])
    month = int(request.args['month'])
    day = int(request.args['day'])
    hour = int(request.args['hour'])
    minute = int(request.args['minute'])
    second = int(request.args['second'])

    date_time = datetime.datetime(year, month, day, hour, minute, second)
    return jsonify(get_obj_vectors(obj_id, 0, date_time))

@app.route('/bodies')
def get_bodies():
    object_set = request.args['object_set']
    ids = get_id_list(object_set)

    year = int(request.args['year'])
    month = int(request.args['month'])
    day = int(request.args['day'])
    hour = int(request.args['hour'])
    minute = int(request.args['minute'])
    second = int(request.args['second'])

    date_time = datetime.datetime(year, month, day, hour, minute, second)
    return jsonify(get_obj_batch(ids, 0, date_time))

@app.route('/objects/<int:sys_id>')
def get_objects(sys_id):
    date = datetime.datetime(2000, 12, 22, 1, 41)
    sys = System.query.get(sys_id)
    ids = [obj.id for obj in sys.objects]
    return jsonify(get_obj_batch(ids, 0, date))

@app.route('/images/<path:img_path>')
def get_image(img_path):
    """Returns the image file located at the given path"""
    return send_file(f'images/{img_path}')

@app.route('/barnes-hut-test')
def test():
    return render_template('barnes-hut-test.html')

@app.route('/test')
def test2():
    date = datetime.datetime(2000, 1, 1, 0, 0)
    # ids = [10, 299]
    ids = [10, 999, 901, 902, 903, 904, 905]
    return jsonify(get_obj_batch(ids, 0, date))
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
    """Renders the base template for the page"""
    return render_template('base.html')


@app.route('/bodies/<int:obj_id>')
def get_object(obj_id):
    """Accepts a date in the query string and a single object id
    Calls get_obj_vectors and returns the output as a JSON object"""
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
    """Accepts a date and object set in the query string
    Calls get_id_list to construct a list of ids to query
    Then calls get_obj_batch and returns the output as a JSON object"""
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


@app.route('/images/<path:img_path>')
def get_image(img_path):
    """Returns the image file located at the given path"""
    return send_file(f'images/{img_path}')

from flask import Flask, request, render_template, redirect, flash, jsonify, send_file
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, System, Object, AltName
from functions import get_obj_batch, get_obj_vectors
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

@app.route('/object/<int:obj_id>')
def get_object(obj_id):
    date = datetime.datetime(2000, 6, 21, 12, 0)
    return jsonify(get_obj_vectors(obj_id, 0, date))

@app.route('/bodies')
def get_bodies():
    date = datetime.datetime(2000, 4, 19, 22, 47) #Jan 19 22:47
    ids = [10, 399, 301]
    # for i in range(601, 654):
    #     ids.append(i)
    # ids.append(65035)
    # ids.append(65040)
    # ids.append(65041)
    # ids.append(65045)
    # ids.append(65048)
    # ids.append(65050)
    # ids.append(65055)
    # ids.append(65056)
    # for i in range(65065, 65082):
    #     ids.append(i)
    # ids.append(65083)
    # ids.append(65084)
    return jsonify(get_obj_batch(ids, 0, date))

@app.route('/objects/<int:sys_id>')
def get_objects(sys_id):
    date = datetime.datetime(2000, 12, 22, 1, 41)
    sys = System.query.get(sys_id)
    ids = [obj.id for obj in sys.objects]
    return jsonify(get_obj_batch(ids, 0, date))

@app.route('/images/<path:img_path>')
def get_image(img_path):
    return send_file(f'images/{img_path}')

@app.route('/barnes-hut-test')
def test():
    return render_template('barnes-hut-test.html')

@app.route('/barnes-hut-test/bodies')
def test2():
    date = datetime.datetime(2000, 1, 1, 0, 0)
    objs = Object.query.all()
    ids = [obj.id for obj in objs]
    return jsonify(get_obj_batch(ids, 0, date))
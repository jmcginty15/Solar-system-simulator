from flask import Flask, request, render_template, redirect, flash, jsonify
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
    date = datetime.datetime(2017, 10, 3, 7, 47)
    return jsonify(get_obj_vectors(obj_id, 0, date))

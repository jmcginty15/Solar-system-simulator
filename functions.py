from astroquery.jplhorizons import Horizons
from julian import to_jd
from models import System, Object, AltName
import datetime

def get_obj_vectors(id, center, datetime):
    """Get position and velocity vectors for a given object at a specified date and time,
    relative to the specified coordinate center.
    Then get object mass and name data from SQL database to combine into a single object."""
    julian = to_jd(datetime, fmt='jd')
    nasa_obj = Horizons(id=id, location=f'500@{center}', epochs=julian, id_type='id')
    vec_table = nasa_obj.vectors()
    pos = [au_to_km(vec_table['x'][0]), au_to_km(vec_table['y'][0]), au_to_km(vec_table['z'][0])]
    vel = [au_to_km(vec_table['vx'][0], vel=True), au_to_km(vec_table['vy'][0], vel=True), au_to_km(vec_table['vz'][0], vel=True)]
    
    database_obj = Object.query.get_or_404(id)
    size = [database_obj.radius_x, database_obj.radius_y, database_obj.radius_z]

    final_obj = {'id': id,
                 'name': database_obj.name,
                 'designation': database_obj.designation,
                 'obj_type': database_obj.obj_type,
                 'sat_type': database_obj.sat_type,
                 'alt_names': database_obj.alt_names,
                 'mass': database_obj.mass,
                 'dimensions': size,
                 'position': pos,
                 'velocity': vel}

    return final_obj

def au_to_km(au, vel=False):
    """Convert from astronomical units (au) to kilometers (km)
    If vel is True, function will convert velocity from au/d to km/s"""
    if vel:
        km = au * 149597870.7 / (24 * 60 * 60)
    else:
        km = au * 149597870.7
    return km

def get_obj_batch(obj_ids, center, datetime):
    """Returns a list of position and velocity vectors for multiple objects"""
    return [get_obj_vectors(obj_id, center, datetime) for obj_id in obj_ids]

def test_barycenter_func():
    """Function to set up a test for barycenter method"""
    date = datetime.datetime(2020, 10, 1, 21, 18)
    pluto_sys = System.query.get(9)
    ids = [obj.id for obj in pluto_sys.objects]
    return get_obj_batch(ids, 0, date)

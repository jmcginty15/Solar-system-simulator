from astroquery.jplhorizons import Horizons
from julian import to_jd
import datetime

def get_obj_vectors(id, datetime):
    """Get position and velocity vectors for a given object at a specified date and time,
    relative to the solar system barycenter"""
    julian = to_jd(datetime, fmt='jd')
    obj = Horizons(id=id, location='500@0', epochs=julian, id_type='id')
    vec_table = obj.vectors()
    pos = [au_to_km(vec_table['x'][0]), au_to_km(vec_table['y'][0]), au_to_km(vec_table['z'][0])]
    vel = [au_to_km(vec_table['vx'][0], vel=True), au_to_km(vec_table['vy'][0], vel=True), au_to_km(vec_table['vz'][0], vel=True)]
    return {'pos': pos, 'vel': vel}

def au_to_km(au, vel=False):
    """Convert from astronomical units (au) to kilometers (km)
    If vel is True, function will convert velocity from au/d to km/s"""
    if vel:
        km = au * 149597870.7 / (24 * 60 * 60)
    else:
        km = au * 149597870.7
    return km

def get_obj_batch(obj_ids, datetime):
    """Returns a list of position and velocity vectors for multiple objects"""
    return [{'id': obj_id, 'vectors': get_obj_vectors(obj_id, datetime)} for obj_id in obj_ids]
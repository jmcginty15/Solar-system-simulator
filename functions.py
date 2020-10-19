from astroquery.jplhorizons import Horizons
from julian import to_jd
from models import System, Object, AltName
import datetime
import numpy
import math

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
                #  'alt_names': database_obj.alt_names,
                 'mass': database_obj.mass,
                 'dimensions': size,
                 'rotation_period': database_obj.rotation_period,
                 'solstice_angle': database_obj.solstice_angle,
                 'axial_tilt': database_obj.axial_tilt,
                 'inclination': database_obj.inclination,
                 'long_asc': database_obj.long_asc,
                 'ring_inner_radius': database_obj.ring_inner_radius,
                 'ring_outer_radius': database_obj.ring_outer_radius,
                 'color_map': database_obj.color_map,
                 'bump_map': database_obj.bump_map,
                 'specular_map': database_obj.specular_map,
                 'cloud_map': database_obj.cloud_map,
                 'cloud_transparency': database_obj.cloud_transparency,
                 'ring_color': database_obj.ring_color,
                 'ring_transparency': database_obj.ring_transparency,
                 'bump_scale': database_obj.bump_scale,
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
    date = datetime.datetime(2017, 10, 1, 21, 18)
    pluto_sys = System.query.get(9)
    ids = [obj.id for obj in pluto_sys.objects]
    return get_obj_batch(ids, 0, date)

def cross_product(v1, v2):
    x1 = v1[0]
    y1 = v1[1]
    z1 = v1[2]

    x2 = v2[0]
    y2 = v2[1]
    z2 = v2[2]
    
    x3 = y1*z2 - z1*y2
    y3 = z1*x2 - x1*z2
    z3 = x1*y2 - y1*x2

    return [x3, y3, z3]

def dot_product(v1, v2):
    x1 = v1[0]
    y1 = v1[1]
    z1 = v1[2]

    x2 = v2[0]
    y2 = v2[1]
    z2 = v2[2]

    return x1 * x2 + y1 * y2 + z1 * z2

def vectors_to_ellipse(r_vec, v_vec, m1, m2):
    G = 6.67408e-20
    mu = G*(m1 + m2)

    x = r_vec[0]
    y = r_vec[1]
    z = r_vec[2]

    vx = v_vec[0]
    vy = v_vec[1]
    vz = v_vec[2]
    
    h_vec = cross_product(r_vec, v_vec)
    
    hx = h_vec[0]
    hy = h_vec[1]
    hz = h_vec[2]

    r = (x**2 + y**2 + z**2)**(1 / 2)
    v = (vx**2 + vy**2 + vz**2)**(1 / 2)
    h = (hx**2 + hy**2 + hz**2)**(1 / 2)    

    E = (v**2 / 2) - (mu / r)
    
    a = -(mu / (2 * E))                                                         # semimajor axis
    e = (1 - (h**2/(a*mu)))**(1 / 2)                                            # eccentricity
    i = numpy.arccos(hz / h)                                                    # inclination

    while i > math.pi:
        i -= 2 * math.pi
    while i < 0:
        i += 2 * math.pi
    
    Omega = math.atan2(hx, -hy)                                                 # longitude of ascending node

    u = math.atan2(z / math.sin(i), x * math.cos(Omega) + y * math.sin(Omega))

    p = a * (1 - e**2)
    nu = math.atan2((p / mu)**(1 / 2) * dot_product(v_vec, r_vec), p - r)       # true anomaly
    omega = u - nu                                                              # argument of periapsis

    return [e, a, math.degrees(i), math.degrees(Omega), math.degrees(omega), math.degrees(nu)]
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

    # these four objects must be queried from the small body database, which is separate from the major body database
    # major body database contains the Sun, all planets and their moons, and Pluto and its moons
    # small body database contains objects such as comets, asteroids, and these four dwarf planets
    if id in [1, 136108, 136199, 136472]:
        id_type = 'smallbody'
    else:
        id_type = 'id'

    # if position and velocity data are not available for the given object at the given date and time,
    # the nasa_obj.vectors() will raise an exception
    # if this happens, we will set the object's available property to false
    try:
        nasa_obj = Horizons(
            id=id, location=f'500@{center}', epochs=julian, id_type=id_type)
        vec_table = nasa_obj.vectors()
        pos = [au_to_km(vec_table['x'][0]), au_to_km(
            vec_table['y'][0]), au_to_km(vec_table['z'][0])]
        vel = [au_to_km(vec_table['vx'][0], vel=True), au_to_km(
            vec_table['vy'][0], vel=True), au_to_km(vec_table['vz'][0], vel=True)]
    except:
        nasa_obj = None

    # after the call is made to JPL Horizons,
    # query our local SQL database for all information needed to construct the object's model
    database_obj = Object.query.get_or_404(id)
    size = [database_obj.radius_x, database_obj.radius_y, database_obj.radius_z]

    # see the Body class in the classes.js file for more information on these properties
    final_obj = {'id': id,
                 'available': False,
                 'name': database_obj.name,
                 'designation': database_obj.designation,
                 'obj_type': database_obj.obj_type,
                 'sat_type': database_obj.sat_type,
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
                 'bump_scale': database_obj.bump_scale}

    # if the nasa_obj.vectors() call raised an exception, the value of nasa_obj will be None
    if nasa_obj:
        final_obj['position'] = pos
        final_obj['velocity'] = vel
        # available is set to True if we have valid position and velocity data
        final_obj['available'] = True

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


def get_id_list(object_set):
    """Constructs a preselected list of object ids for a given object set"""
    mars_moons = [401, 402]
    jupiter_moons = [i for i in range(501, 573)]
    for i in range(55501, 55508):
        jupiter_moons.append(i)
    saturn_moons = [i for i in range(601, 654)]
    for i in [65035, 65040, 65041, 65045, 65048, 65050, 65055, 65056]:
        saturn_moons.append(i)
    for i in range(65065, 65085):
        saturn_moons.append(i)
    uranus_moons = [i for i in range(701, 728)]
    neptune_moons = [i for i in range(801, 815)]
    pluto_moons = [i for i in range(901, 906)]

    if object_set == 'full':                # full solar system
        id_list = [10, 199, 299, 399, 301, 499, 1]
        for moon_id in mars_moons:
            id_list.append(moon_id)
        id_list.append(599)
        for moon_id in jupiter_moons:
            id_list.append(moon_id)
        id_list.append(699)
        for moon_id in saturn_moons:
            id_list.append(moon_id)
        id_list.append(799)
        for moon_id in uranus_moons:
            id_list.append(moon_id)
        id_list.append(899)
        for moon_id in neptune_moons:
            id_list.append(moon_id)
        id_list.append(999)
        for moon_id in pluto_moons:
            id_list.append(moon_id)
        id_list.append(136108)
        id_list.append(136199)
        id_list.append(136472)
    elif object_set == 'inner':             # inner solar system
        id_list = [10, 199, 299, 399, 301, 499, 401, 402, 1]
    elif object_set == 'outer':             # outer solar system
        id_list = [10, 599]
        for moon_id in jupiter_moons:
            id_list.append(moon_id)
        id_list.append(699)
        for moon_id in saturn_moons:
            id_list.append(moon_id)
        id_list.append(799)
        for moon_id in uranus_moons:
            id_list.append(moon_id)
        id_list.append(899)
        for moon_id in neptune_moons:
            id_list.append(moon_id)
        id_list.append(999)
        for moon_id in pluto_moons:
            id_list.append(moon_id)
        id_list.append(136108)
        id_list.append(136199)
        id_list.append(136472)
    elif object_set == 'planets':           # planets only
        id_list = [10, 199, 299, 399, 499, 599, 699, 799, 899]
    elif object_set == 'dwarves':           # dwarf planets only
        id_list = [10, 1, 999, 136108, 136199, 136472]
    elif object_set == 'planets-dwarves':   # planets and dwarf planets
        id_list = [10, 199, 299, 399, 499, 1, 599,
                   699, 799, 899, 999, 136108, 136199, 136472]
    elif object_set == '3':                 # earth-moon system
        id_list = [10, 399, 301]
    elif object_set == '4':                 # martian system
        id_list = [10, 499, 401, 402]
    elif object_set == '5':                 # jovian system
        id_list = [10, 599]
        for moon_id in jupiter_moons:
            id_list.append(moon_id)
    elif object_set == '6':                 # saturnian system
        id_list = [10, 699]
        for moon_id in saturn_moons:
            id_list.append(moon_id)
    elif object_set == '7':                 # uranian system
        id_list = [10, 799]
        for moon_id in uranus_moons:
            id_list.append(moon_id)
    elif object_set == '8':                 # neptunian system
        id_list = [10, 899]
        for moon_id in neptune_moons:
            id_list.append(moon_id)
    elif object_set == '9':                 # plutonian system
        id_list = [10, 999]
        for moon_id in pluto_moons:
            id_list.append(moon_id)
    return id_list

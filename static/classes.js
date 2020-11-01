class Body {
    // class to represent a star, planet, dwarf planet, or moon
    constructor(obj) {
        this.designation = obj.designation;                 // object's IAU designation
        this.dimensions = obj.dimensions;                   // 3D vector to determine ellipsoid shape
        this.rotation_period = obj.rotation_period;         // used to determine speed of rotation
        this.x_rotation = Math.random() / 1000;             // these random rotation values will be used to give the
        this.y_rotation = Math.random() / 1000;             //  object some more interesting motion if the real rotation
        this.z_rotation = Math.random() / 1000;             //  period was not available online
        this.id = obj.id;                                   // unique integer id
        this.available = obj.available;                     // boolean value, will be false if position and velocity data from JPL Horizons were not available for the selected date/time
        this.mass = obj.mass;                               // object's mass
        this.name = obj.name;                               // object's name
        this.obj_type = obj.obj_type;                       // star, terrestrial planet, gas giant, ice giant, or dwarf planet
        this.sat_type = obj.sat_type;                       // for moons of the gas and ice giants, indicates which group a moon belongs to
        this.acceleration = [0, 0, 0];                      // 3D acceleration vector
        this.force = [0, 0, 0];                             // 3D force vector
        this.solstice_angle = obj.solstice_angle;           // angle of object's summer solstice, to determine direction of axial tilt
        this.axial_tilt = obj.axial_tilt;                   // axial tilt, to be used in combination with inclination and long_asc
        this.inclination = obj.inclination;                 // orbital inclination, to be used for determining tilt
        this.long_asc = obj.long_asc;                       // longitude of ascending node, to be used for determining tilt
        this.ring_inner_radius = obj.ring_inner_radius;     // inner radius of rings
        this.ring_outer_radius = obj.ring_outer_radius;     // outer radius of rings
        this.color_map = obj.color_map;                     // color map texture for object's surface
        this.bump_map = obj.bump_map;                       // bump map texture for object's surface
        this.bump_scale = obj.bump_scale;                   // scale factor for bump map
        this.specular_map = obj.specular_map;               // specular map texture to determine object's reflectivity
        this.cloud_map = obj.cloud_map;                     // color map texture for object's cloud layer
        this.cloud_transparency = obj.cloud_transparency;   // alpha map texture for object's cloud layer
        this.ring_color = obj.ring_color;                   // color map texture for rings
        this.ring_transparency = obj.ring_transparency;     // alpha map texture for rings
        this.model = null;                                  // property to associate a THREE.js object when it is created

        if (this.available) {
            this.position = obj.position;                   // 3D position vector
            this.velocity = obj.velocity;                   // 3D velocity vector
        }
    }

    updateAcceleration() {
        // updates the object's acceleration vector using the calculated force vector and returns the new acceleration vector
        const force = this.force;
        const x = force[0] / this.mass;
        const y = force[1] / this.mass;
        const z = force[2] / this.mass;
        const newAcc = [x, y, z];
        this.acceleration = newAcc;
        return newAcc;
    }

    updateVelocity(tStep) {
        // updates the object's velocity vector and returns the new velocity vector
        const vel = this.velocity;
        const accel = this.acceleration;
        const x = vel[0] + tStep * accel[0];
        const y = vel[1] + tStep * accel[1];
        const z = vel[2] + tStep * accel[2];
        const newVel = [x, y, z];
        this.velocity = newVel;
        return newVel;
    }

    updatePosition(tStep) {
        // updates the object's position vector and returns the new position vector
        const pos = this.position;
        const vel = this.velocity;
        const x = pos[0] + tStep * vel[0];
        const y = pos[1] + tStep * vel[1];
        const z = pos[2] + tStep * vel[2];
        const newPos = [x, y, z];
        this.position = newPos;
        return newPos;
    }

    updateModel(tStep) {
        // updates the position and rotation of the object's THREE.js model in the scene
        this.model.position.set(this.position[0], this.position[1], this.position[2]);
        if (this.rotation_period) {
            // if the object has a rotation period in the database, rotate it on the z-axis
            const rotationSpeed = 2 * Math.PI / this.rotation_period;
            this.model.rotation.z += rotationSpeed * tStep;
        } else {
            // if the object does not have a rotation period in the database,
            // use the object's randomly generated rotation increments
            this.model.rotation.x += this.x_rotation;
            this.model.rotation.y += this.y_rotation;
            this.model.rotation.z += this.z_rotation;
        }
    }

    getDistance(primary) {
        // calculates the object's distance to another body
        return Math.sqrt((this.position[0] - primary.position[0])**2 + (this.position[1] - primary.position[1])**2 + (this.position[2] - primary.position[2])**2);
    }

    getOrbitalSpeed(primary) {
        // calculates the object's speed relative to another body
        return Math.sqrt((this.velocity[0] - primary.velocity[0])**2 + (this.velocity[1] - primary.velocity[1])**2 + (this.velocity[2] - primary.velocity[2])**2);
    }

    getOrbitalParams(primary) {
        // calculates the object's orbital elements with reference to another body
        const G = 6.67408e-20;
        const mu = G * (primary.mass + this.mass);

        const r_vec = this.position;
        const v_vec = this.velocity;

        const x = r_vec[0];
        const y = r_vec[1];
        const z = r_vec[2];

        const vx = v_vec[0];
        const vy = v_vec[1];
        const vz = v_vec[2];

        const h_vec = crossProduct(r_vec, v_vec);

        const hx = h_vec[0];
        const hy = h_vec[1];
        const hz = h_vec[2];

        const r = (x ** 2 + y ** 2 + z ** 2) ** (1 / 2);
        const v = (vx ** 2 + vy ** 2 + vz ** 2) ** (1 / 2);
        const h = (hx ** 2 + hy ** 2 + hz ** 2) ** (1 / 2);

        const E = (v ** 2 / 2) - (mu / r);

        const a = -(mu / (2 * E));                                                          // semimajor axis
        const e = (1 - (h ** 2 / (a * mu))) ** (1 / 2);                                     // eccentricity
        let i = Math.acos(hz / h);                                                          // inclination
        i = adjustAngleRange(i, 0, Math.PI);

        let Omega = Math.atan2(hx, -hy);                                                    // longitude of ascending node
        Omega = adjustAngleRange(Omega, 0, 2 * Math.PI);

        const u = Math.atan2(z / Math.sin(i), x * Math.cos(Omega) + y * Math.cos(Omega));
        const p = a * (1 - e ** 2);

        let nu = Math.atan2((p / mu) ** (1 / 2) * dotProduct(v_vec, r_vec), p - r);         // true anomaly
        let w = u - nu;                                                                     // argument of periapse
        nu = adjustAngleRange(nu, 0, 2 * Math.PI);
        w = adjustAngleRange(w, 0, 2 * Math.PI);

        return {
            eccentricity: e,
            semimajorAxis: a,
            inclination: i,
            longAscNode: Omega,
            argPeriapse: w,
            trueAnomaly: nu
        }
    }
}

class System {
    // class to represent a planetary system, or the whole solar system
    constructor(id, bodyList) {
        this.id = id;                       // unique integer id
        this.bodies = bodyList;             // array of all bodies in the system
        this.primary = this.bodies[0];      // system's primary body, will always be the sun or a planet or dwarf planet
        this.position = [0, 0, 0];          // 3D position vector of the system's barycenter
        this.velocity = [0, 0, 0];          // 3D velocity vector of the system's barycenter
        this.mass = 0;

        for (let body of this.bodies) {
            this.mass += body.mass;         // total mass of the system
        }

        if (id === 0) {                     // assign name and radius according to id
            this.name = 'Solar';
            this.radius = 1.457936e+10;     // radius is the apoapsis distance of the furthest-out object from the
        } else if (id === 3) {              // center of the system
            this.name = 'Earth-Moon';
            this.radius = 405400;
        } else if (id === 4) {
            this.name = 'Martian';
            this.radius = 23470.9;
        } else if (id === 5) {
            this.name = 'Jovian';
            this.radius = 39427165.8;
        } else if (id === 6) {
            this.name = 'Saturnian';
            this.radius = 30694994.4;
        } else if (id === 7) {
            this.name = 'Uranian';
            this.radius = 28596748.2;
        } else if (id === 8) {
            this.name = 'Neptunian';
            this.radius = 77784500;
        } else if (id === 9) {
            this.name = 'Plutonian';
            this.radius = 65117.494156;
        }
    }

    updatePosition() {
        // sets or updates the position vector of the system barycenter
        const posMass = [0, 0, 0];
        for (let body of this.bodies) {
            if (body.available) {
                posMass[0] += body.position[0] * body.mass;
                posMass[1] += body.position[1] * body.mass;
                posMass[2] += body.position[2] * body.mass;
            }
        }
        posMass[0] /= this.mass;
        posMass[1] /= this.mass;
        posMass[2] /= this.mass;
        this.position = posMass;
        return posMass;
    }

    updateVelocity() {
        // sets or updates the velocity vector of the system barycenter
        const velMass = [0, 0, 0];
        for (let body of this.bodies) {
            if (body.available) {
                velMass[0] += body.velocity[0] * body.mass;
                velMass[1] += body.velocity[1] * body.mass;
                velMass[2] += body.velocity[2] * body.mass;
            }
        }
        velMass[0] /= this.mass;
        velMass[1] /= this.mass;
        velMass[2] /= this.mass;
        this.velocity = velMass;
        return velMass;
    }

    getDistance(primary) {
        // calculates the distance from the system barycenter to another body
        return Math.sqrt((this.position[0] - primary.position[0])**2 + (this.position[1] - primary.position[1])**2 + (this.position[2] - primary.position[2])**2);
    }

    getOrbitalSpeed(primary) {
        // calculates the speed of the system barycenter relative to another body
        return Math.sqrt((this.velocity[0] - primary.velocity[0])**2 + (this.velocity[1] - primary.velocity[1])**2 + (this.velocity[2] - primary.velocity[2])**2);
    }
}

function crossProduct(v1, v2) {
    // calculates the cross product of two vectors
    return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
}

function dotProduct(v1, v2) {
    // calculates the dot product of two vectors
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

function adjustAngleRange(angle, min, max) {
    // adjusts an angle to within the given range, such as 0 to 2pi or -pi to pi
    while (angle < min) {
        angle += 2 * Math.PI;
    }
    while (angle > max) {
        angle -= 2 * Math.PI;
    }

    return angle;
}

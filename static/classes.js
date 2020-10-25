class Body {
    constructor(obj) {
        this.designation = obj.designation;
        this.dimensions = obj.dimensions;
        this.rotation_period = obj.rotation_period;
        this.id = obj.id;
        this.mass = obj.mass;
        this.name = obj.name;
        this.obj_type = obj.obj_type;
        this.sat_type = obj.sat_type;
        this.position = obj.position;
        this.position_delta = [];
        this.velocity = obj.velocity;
        this.acceleration = [0, 0, 0];
        this.force = [0, 0, 0];
        this.solstice_angle = obj.solstice_angle;
        this.axial_tilt = obj.axial_tilt;
        this.inclination = obj.inclination;
        this.long_asc = obj.long_asc;
        this.ring_inner_radius = obj.ring_inner_radius;
        this.ring_outer_radius = obj.ring_outer_radius;
        this.color_map = obj.color_map;
        this.bump_map = obj.bump_map;
        this.specular_map = obj.specular_map;
        this.cloud_map = obj.cloud_map;
        this.cloud_transparency = obj.cloud_transparency;
        this.ring_color = obj.ring_color;
        this.ring_transparency = obj.ring_transparency;
        this.bump_scale = obj.bump_scale
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

    orbitalParams(orbiting) {
        // calculates the object's orbital elements with reference to its primary body
        const G = 6.67408e-20;
        const mu = G*(orbiting.mass + this.mass);

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

        const r = (x**2 + y**2 + z**2)**(1 / 2);
        const v = (vx**2 + vy**2 + vz**2)**(1 / 2);
        const h = (hx**2 + hy**2 + hz**2)**(1 / 2);

        const E = (v**2 / 2) - (mu / r);

        const a = -(mu / (2*E));                                                      // semimajor axis
        const e = (1 - (h**2 / (a*mu)))**(1 / 2);                                     // eccentricity
        let i = Math.acos(hz / h);                                                    // inclination
        i = adjustAngleRange(i, 0, Math.PI);

        let Omega = Math.atan2(hx, -hy);                                              // longitude of ascending node
        Omega = adjustAngleRange(Omega, 0, 2*Math.PI);

        const u = Math.atan2(z / Math.sin(i), x*Math.cos(Omega) + y*Math.cos(Omega));
        const p = a * (1 - e**2);

        let nu = Math.atan2((p / mu)**(1 / 2) * dotProduct(v_vec, r_vec), p - r);     // true anomaly
        let w = u - nu;                                                               // argument of periapse
        nu = adjustAngleRange(nu, 0, 2*Math.PI);
        w = adjustAngleRange(w, 0, 2*Math.PI);

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

function crossProduct(v1, v2) {
    return [v1[1]*v2[2] - v1[2]*v2[1], v1[2]*v2[0] - v1[0]*v2[2], v1[0]*v2[1] - v1[1]*v2[0]];
}

function dotProduct(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

function adjustAngleRange(angle, min, max) {
    while (angle < min) {
        angle += 2 * Math.PI;
    }
    while (angle > max) {
        angle -= 2 * Math.PI;
    }

    return angle;
}

function distance(obj1, obj2) {
    // returns the distance between two objects
    // units: km
    const x = obj2.position[0] - obj1.position[0];
    const y = obj2.position[1] - obj1.position[1];
    const z = obj2.position[2] - obj1.position[2];
    return Math.sqrt(x**2 + y**2 + z**2);
}

function forceMagnitude(obj1, obj2) {
    // returns the magnitude of the gravitational force between two objects
    // units: kN
    return (G * obj1.mass * obj2.mass) / distance(obj1, obj2)**2;
}

function thetaDir(obj1, obj2) {
    // returns the angle between the x-axis and obj2 as seen from obj1
    // units: radians
    const x = obj2.position[0] - obj1.position[0];
    const y = obj2.position[1] - obj1.position[1];
    return Math.atan2(y, x);
}

function phiDir(obj1, obj2) {
    // returns the angle between the x-y plane and obj2 as seen from obj1
    // units: radians
    const x = obj2.position[0] - obj1.position[0];
    const y = obj2.position[1] - obj1.position[1];
    const xy = Math.sqrt(x**2 + y**2);
    const z = obj2.position[2] - obj1.position[2];
    return Math.atan2(z, xy);
}

function forceVector(obj1, obj2) {
    // returns the three-dimensional force vector for obj2's gravity acting on obj1
    // units: kN
    const forceMag = forceMagnitude(obj1, obj2);
    const theta = thetaDir(obj1, obj2);
    const phi = phiDir(obj1, obj2);
    const xy = forceMag * Math.cos(phi);
    const x = xy * Math.cos(theta);
    const y = xy * Math.sin(theta);
    const z = forceMag * Math.sin(phi);
    return [x, y, z];
}

function accVector(obj1, obj2) {
    // returns the three-dimensional acceleration vector induced on obj1 by obj2's gravity
    // units: km/s2
    const force = forceVector(obj1, obj2);
    const x = force[0] / obj1.mass;
    const y = force[1] / obj1.mass;
    const z = force[2] / obj1.mass;
    return [x, y, z];
}

function reverseVector(vec) {
    // returns the input vector pointing in the opposite direction
    return [-vec[0], -vec[1], -vec[2]];
}
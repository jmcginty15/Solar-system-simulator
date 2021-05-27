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
        this.marker = null;                                 // property to associate a screen marker when it is in the camera's FOV
        this.cameraDistance = 0;                            // object's distance from the camera

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

    createMarker(camera, showTags) {
        let color = '255, 255, 255';
        switch (this.obj_type) {
            case 'G-type main-sequence star':
                color = '255, 255, 0';
                break;
            case 'Terrestrial planet':
                color = '0, 255, 0';
                break;
            case 'Gas giant':
                color = '255, 0, 0';
                break;
            case 'Ice giant':
                color = '7, 242, 241';
                break;
            case 'Dwarf planet':
                color = '0, 0, 255';
                break;
        }
        this.marker = new Marker(camera, this.model.position.clone(), Math.max(...this.dimensions), this.name, this.designation, this.id, this.obj_type, this.sat_type, color, showTags);
    }

    updateMarker(camera) {
        const position = this.model.position.clone();
        if (this.marker !== null) this.marker.update(camera, position, Math.max(...this.dimensions));
        else this.createMarker(camera);
    }

    destroyMarker() {
        if (this.marker !== null) {
            this.marker.destroy();
            this.marker = null;
        }
    }

    getDistance(primary) {
        // calculates the object's distance to another body
        return Math.sqrt((this.position[0] - primary.position[0]) ** 2 + (this.position[1] - primary.position[1]) ** 2 + (this.position[2] - primary.position[2]) ** 2);
    }

    getOrbitalSpeed(primary) {
        // calculates the object's speed relative to another body
        return Math.sqrt((this.velocity[0] - primary.velocity[0]) ** 2 + (this.velocity[1] - primary.velocity[1]) ** 2 + (this.velocity[2] - primary.velocity[2]) ** 2);
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
        return Math.sqrt((this.position[0] - primary.position[0]) ** 2 + (this.position[1] - primary.position[1]) ** 2 + (this.position[2] - primary.position[2]) ** 2);
    }

    getOrbitalSpeed(primary) {
        // calculates the speed of the system barycenter relative to another body
        return Math.sqrt((this.velocity[0] - primary.velocity[0]) ** 2 + (this.velocity[1] - primary.velocity[1]) ** 2 + (this.velocity[2] - primary.velocity[2]) ** 2);
    }
}

class Marker {
    // class to represent a screen marker to be attached to a body
    constructor(camera, objectPosition, radius, name, designation, id, objectType, satType, color, showTags) {
        this.x = null;
        this.y = null;
        this.domElement = null;
        this.radius = 0;
        this.cameraDistance = 0;
        this.zIndex = 0;
        this.opacity = 0;
        this.color = color;
        this.hovering = false;

        const marker = document.createElement('div');
        marker.classList.add('marker');
        marker.id = `${id}-marker`;
        viewport.appendChild(marker);
        marker.addEventListener('mouseenter', () => highlight(this));
        marker.addEventListener('mouseleave', () => unhighlight(this));
        this.domElement = marker;

        this.update(camera, objectPosition, radius);
        const tagName = name ? name : designation;
        const tagType = (satType && !(objectType in ['Earth', 'Pluto'])) ? satType : objectType;
        this.tag = new Tag(tagName, id, tagType, color, this.x, this.y, this.radius, this.cameraDistance, showTags, this.zIndex, this.opacity, this);
    }

    update(camera, objectPosition, radius) {
        const positionClone = objectPosition.clone();
        this.setPosition(camera, objectPosition);
        this.setDisplay(camera, positionClone, radius);
        if (this.tag) this.tag.update(this.x, this.y, this.radius, this.cameraDistance, this.zIndex, this.opacity);
    }

    setPosition(camera, objectPosition) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        objectPosition.project(camera);
        this.x = (objectPosition.x + 1) * width / 2;
        this.y = -(objectPosition.y - 1) * height / 2;
        this.domElement.style.left = `${this.x - this.radius}px`;
        this.domElement.style.top = `${this.y - this.radius}px`;
    }

    setDisplay(camera, objectPosition, radius) {
        const xDist = camera.position.x - objectPosition.x;
        const yDist = camera.position.y - objectPosition.y;
        const zDist = camera.position.z - objectPosition.z;
        const dist = Math.sqrt(xDist ** 2 + yDist ** 2 + zDist ** 2);
        this.cameraDistance = dist;
        const angularDiameter = Math.atan2(radius, 2 * dist) * 2;
        let markerDiameter = angularDiameter * 8000;
        if (markerDiameter < 10) markerDiameter = 10;

        this.domElement.style.width = `${markerDiameter}px`;
        this.domElement.style.height = `${markerDiameter}px`;
        this.radius = markerDiameter / 2;

        this.zIndex = Math.floor(2147483638 - (1073741819 * dist) / 15000000000000);
        this.domElement.style.zIndex = this.zIndex;

        let opacity = this.hovering ? 0.85 : 0.85 - dist / 50000000000;
        if (opacity < 0.35) opacity = 0.35;
        this.opacity = opacity;
        this.domElement.style.borderColor = `rgba(${this.color}, ${opacity})`;
    }

    destroy() {
        this.tag.destroy();
        this.domElement.remove();
    }
}

class Tag {
    // class to represent a tag to be attached to a marker
    constructor(name, id, objectType, color, markerX, markerY, markerRadius, cameraDistance, showTags, zIndex, opacity, parentMarker) {
        let symbol = '';
        switch (name) {
            case 'Sun':
                symbol = `☉`;
                break;
            case 'Mercury':
                symbol = `☿`;
                break;
            case 'Venus':
                symbol = `♀`;
                break;
            case 'Earth':
                symbol = `🜨`;
                break;
            case 'Moon':
                symbol = `☾`;
                break;
            case 'Mars':
                symbol = `♂`;
                break;
            case 'Ceres':
                symbol = `⚳`;
                break;
            case 'Jupiter':
                symbol = `♃`;
                break;
            case 'Saturn':
                symbol = `♄`;
                break;
            case 'Uranus':
                symbol = `⛢`;
                break;
            case 'Neptune':
                symbol = `♆`;
                break;
            case 'Pluto':
                symbol = `♇`;
                break;
        }

        this.name = name;
        this.id = id;
        this.color = color;
        this.parentMarker = parentMarker;

        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.id = `${id}-tag`;
        tag.innerHTML = `<div class="object-name">
                <span class="symbol">${symbol}</span> <span id="${id}-name" class="name">${name}</span>
            </div>
            <div class="object-type"><em>${objectType}</em></div>
            <div class="object-distance"><em id="${name}-dist"></em></div>`;
        if (!showTags) tag.style.display = 'none';
        tag.addEventListener('mouseenter', () => highlight(this.parentMarker));
        tag.addEventListener('mouseleave', () => unhighlight(this.parentMarker));
        viewport.appendChild(tag);

        this.domElement = tag;

        this.setDisplay(markerX, markerY, markerRadius, cameraDistance, zIndex, opacity);
    }

    update(markerX, markerY, markerRadius, cameraDistance, zIndex, opacity) {
        this.setDisplay(markerX, markerY, markerRadius, cameraDistance, zIndex, opacity);
    }

    setDisplay(markerX, markerY, markerRadius, cameraDistance, zIndex, opacity) {
        this.domElement.style.borderColor = `rgba(${this.color}, ${opacity})`;
        this.domElement.style.color = `rgba(${this.color}, ${opacity})`;

        const x = markerX + markerRadius * Math.cos(Math.PI / 4);
        const y = markerY - markerRadius * Math.sin(Math.PI / 4) - this.domElement.offsetHeight;
        this.domElement.style.left = `${x}px`;
        this.domElement.style.top = `${y}px`;
        this.domElement.style.zIndex = zIndex;

        const distLabel = document.getElementById(`${this.name}-dist`);
        distLabel.innerText = this.parseDistance(cameraDistance);
    }

    parseDistance(cameraDistance) {
        let parsedDist = cameraDistance;
        let distLabel = '';
        if (parsedDist >= 1e+6 && parsedDist < 1e+9) {
            parsedDist /= 1e+6;
            distLabel = 'million';
        } else if (parsedDist >= 1e+9) {
            parsedDist /= 1e+9;
            distLabel = 'billion';
        }
        return `${+parsedDist.toFixed(2)} ${distLabel} km`;
    }

    destroy() {
        this.domElement.remove();
    }
}

function highlight(marker) {
    marker.hovering = true;
}

function unhighlight(marker) {
    marker.hovering = false;
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

export { Body, System, Marker };

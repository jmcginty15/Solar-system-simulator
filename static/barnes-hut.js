// this class is used to run the Barnes-Hut approximation algorithm
// this algorithm reduces the number of calculations needed to update force, acceleration, velocity, and position vectors

const G = 6.67408e-20 // universal gravitational constant, km3/(kg*s2)

class Tree {
    constructor(minCoordinates, sideLength) {
        this.bodies = [];
        this.centerMass = null;
        this.totalMass = 0;
        this.isExternalNode = true;
        this.minCoordinates = minCoordinates;
        this.sideLength = sideLength;
        this.children = {
            NETop: null,
            NWTop: null,
            SETop: null,
            SWTop: null,
            NEBottom: null,
            NWBottom: null,
            SEBottom: null,
            SWBottom: null
        }
    }

    addBody(body) {
        this.bodies.push(body);
        this.updateCenterMass(body);
        this.updateTotalMass(body);

        if (this.bodies.length > 1) {
            this.isExternalNode = false;
            if (this.bodies.length === 2) {
                const octant0 = this.getOctant(this.bodies[0]);
                this.children[octant0.name] = new Tree(octant0.minCoordinates, octant0.sideLength);
                this.children[octant0.name].addBody(this.bodies[0]);
            }

            const octant = this.getOctant(body);
            if (!this.children[octant.name]) {
                this.children[octant.name] = new Tree(octant.minCoordinates, octant.sideLength);
            }
            this.children[octant.name].addBody(body);
        }
    }

    updateCenterMass(body) {
        // updates the node's center of mass when a body is added
        // should be called BEFORE updateTotalMass is called
        // returns the three dimensional position vector of the new center of mass
        // units: km
        if (!this.centerMass) {
            this.centerMass = body.position;
        } else {
            const x = (this.centerMass[0] * this.totalMass + body.position[0] * body.mass) / (this.totalMass + body.mass);
            const y = (this.centerMass[1] * this.totalMass + body.position[1] * body.mass) / (this.totalMass + body.mass);
            const z = (this.centerMass[2] * this.totalMass + body.position[2] * body.mass) / (this.totalMass + body.mass);
            this.centerMass = [x, y, z];
        }
        return this.centerMass;
    }

    updateTotalMass(body) {
        // updates the node's total mass when a body is added
        // should be called AFTER updateCenterMass is called
        // returns the new total mass
        // units: kg
        this.totalMass += body.mass;
        return this.totalMass;
    }

    getForceVector(body, thetaThreshold) {
        // calculates force vector for node's gravitational force acting on body
        // units: kN
        const rVec = this.getRelativePosition(body);
        const r = Math.sqrt(rVec[0] ** 2 + rVec[1] ** 2 + rVec[2] ** 2);  // distance between body and node center of mass in km
        const theta = this.sideLength / r;

        if (this.isExternalNode && this.bodies[0].id === body.id) {
            // if body is the only body contained in the node, return a zero-magnitude vector
            // body does not exert any gravitational force on itself
            return [0, 0, 0];
        }

        if (this.isExternalNode || theta < thetaThreshold) {
            // if node is an external node or theta is under the threshold value, treat node as a single body
            const m1 = this.totalMass;
            const m2 = body.mass;
            const F = (G * m1 * m2) / r ** 2;                       // magnitude of gravitational force in kN

            const xy = Math.sqrt(rVec[0] ** 2 + rVec[1] ** 2);
            const theta = Math.atan2(rVec[1], rVec[0]);             // angle between x-axis and node center of mass, in x-y plane, as seen from body
            const phi = Math.atan2(rVec[2], xy);                    // angle between x-y plane and node center of mass as seen from body

            const Fxy = F * Math.cos(phi);                          // component of force in the x-y plane
            const Fx = Fxy * Math.cos(theta);                       // x-component of force
            const Fy = Fxy * Math.sin(theta);                       // y-component of force
            const Fz = F * Math.sin(phi);                           // z-component of force

            return [Fx, Fy, Fz];
        } else {
            // else sum force vectors from all child nodes
            const totalForce = [0, 0, 0];
            const childNodes = this.children;

            for (let octant in childNodes) {
                if (childNodes[octant]) {
                    const nextForce = childNodes[octant].getForceVector(body, thetaThreshold);
                    totalForce[0] += nextForce[0];
                    totalForce[1] += nextForce[1];
                    totalForce[2] += nextForce[2];
                }
            }

            return totalForce;
        }
    }

    getRelativePosition(body) {
        // calculates relative position vector from body to current node's center of mass
        // units: km
        const x = this.centerMass[0] - body.position[0];
        const y = this.centerMass[1] - body.position[1];
        const z = this.centerMass[2] - body.position[2];
        return [x, y, z];
    }

    getOctant(body) {
        // determines which child octant a new body belongs in according to its position vector
        // returns an object containing the name, origin coordinates, and side length of the child octant
        // units: km
        const x = body.position[0];
        const y = body.position[1];
        const z = body.position[2];

        const minCoordinates = this.minCoordinates;
        const sideLength = this.sideLength;

        let newOctantName = '';
        let newOctantMinCoordinates = [];
        const newOctantSideLength = sideLength / 2;

        if (x >= minCoordinates[0] + newOctantSideLength) {
            if (y >= minCoordinates[1] + newOctantSideLength) {
                if (z >= minCoordinates[2] + newOctantSideLength) {
                    newOctantName = 'NETop';
                    newOctantMinCoordinates = [minCoordinates[0] + newOctantSideLength, minCoordinates[1] + newOctantSideLength, minCoordinates[2] + newOctantSideLength];
                } else {
                    newOctantName = 'NEBottom';
                    newOctantMinCoordinates = [minCoordinates[0] + newOctantSideLength, minCoordinates[1] + newOctantSideLength, minCoordinates[2]];
                }
            } else {
                if (z >= minCoordinates[2] + newOctantSideLength) {
                    newOctantName = 'SETop';
                    newOctantMinCoordinates = [minCoordinates[0] + newOctantSideLength, minCoordinates[1], minCoordinates[2] + newOctantSideLength];
                } else {
                    newOctantName = 'SEBottom';
                    newOctantMinCoordinates = [minCoordinates[0] + newOctantSideLength, minCoordinates[1], minCoordinates[2]];
                }
            }
        } else {
            if (y >= minCoordinates[1] + newOctantSideLength) {
                if (z >= minCoordinates[2] + newOctantSideLength) {
                    newOctantName = 'NWTop';
                    newOctantMinCoordinates = [minCoordinates[0], minCoordinates[1] + newOctantSideLength, minCoordinates[2] + newOctantSideLength];
                } else {
                    newOctantName = 'NWBottom';
                    newOctantMinCoordinates = [minCoordinates[0], minCoordinates[1] + newOctantSideLength, minCoordinates[2]];
                }
            } else {
                if (z >= minCoordinates[2] + newOctantSideLength) {
                    newOctantName = 'SWTop';
                    newOctantMinCoordinates = [minCoordinates[0], minCoordinates[1], minCoordinates[2] + newOctantSideLength];
                } else {
                    newOctantName = 'SWBottom';
                    newOctantMinCoordinates = [minCoordinates[0], minCoordinates[1], minCoordinates[2]];
                }
            }
        }

        return {
            name: newOctantName,
            minCoordinates: newOctantMinCoordinates,
            sideLength: newOctantSideLength
        }
    }
}

export default Tree

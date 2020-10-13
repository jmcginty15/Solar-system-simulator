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

const bodies = [];

for (let i = 0; i < 10; i++) {
    let x = 20 * Math.random() - 10;
    let y = 20 * Math.random() - 10;
    let z = 20 * Math.random() - 10;
    let m = 100 * Math.random();
    let body = new Body({
        position: [x, y, z],
        mass: m
    });
    bodies.push(body);
}

const tree = new Tree([-10, -10, -10], 20);

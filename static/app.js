import * as THREE from './node_modules/three/src/Three.js';
import { FlyControls } from './node_modules/three/examples/jsm/controls/FlyControls.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from './node_modules/three/examples/jsm/controls/TrackballControls.js';
import { Mesh, Vector3 } from './node_modules/three/src/Three.js';

$(async function () {
    // const G = 6.67408e-20 // km3/(kg*s2)
    let go = false;

    const viewport = document.getElementById('viewport');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.0000000001, 2400000000000);
    camera.up = new THREE.Vector3(0, 0, 1);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    viewport.appendChild(renderer.domElement);

    const orbitControls = new OrbitControls(camera, viewport);
    orbitControls.enableZoom = true;
    orbitControls.enableKeys = true;
    orbitControls.keyPanSpeed = 100000;

    var skySphere = new THREE.SphereGeometry(24000000000, 32, 32);
    var milkyWay = new THREE.TextureLoader().load('/images/background/ESO_-_Milky_Way.jpg');
    milkyWay.anisotropy = renderer.capabilities.getMaxAnisotropy();
    milkyWay.flipY = false;
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: milkyWay });
    const background = new Mesh(skySphere, backgroundMaterial);
    background.material.side = THREE.BackSide;
    background.rotation.x = - (90 - 60) * (Math.PI / 180);
    scene.add(background);

    let obj1 = 0;
    let obj2 = 0;
    const sceneBodies = [];
    let simTime = 0;

    var axes = new THREE.AxesHelper(100000000000);
    scene.add(axes);

    // var res = await axios.get(`http://127.0.0.1:5000/object/${10}`);
    // var sun = res.data;

    // res = await axios.get(`http://127.0.0.1:5000/object/${399}`);
    // var sys = res.data;
    // plotOrbit(sys, sun);
    // const system = [sys];

    var res = await axios.get('http://127.0.0.1:5000/test');
    const sys = res.data;
    // var sun = sys[0];
    // var earth = sys[1];
    // plotOrbit(earth, sun);

    const simBodies = [];
    for (let body of sys) {
        simBodies.push(new Body(body));
    }

    // var starLight = new THREE.AmbientLight(0x404040, 0.5);
    // scene.add(starLight);

    // system.unshift(sun);

    for (let obj of simBodies) {
        addToScene(obj);
    }

    let i = 0;
    let time = 0;
    let tstart = false;
    let cameraTarget = null;

    const cameraZPos = simBodies[1].position[2] + avgRadius(simBodies[1]) * 3
    camera.position.set(simBodies[1].position[0], simBodies[1].position[1], simBodies[1].position[2] + 20000000);
    // camera.position.set(0, 0, 500000000);
    // camera.position.set(0, 0, 0);    
    var render = function () {
        requestAnimationFrame(render);
        let lastPos = [];
        let newPos = [];
        let delta = [];

        if (go) {
            const tStep = 60;
            const sysTree = new Tree([-2e10, -2e10, -2e10], 4e10);

            for (let body of simBodies) {
                sysTree.addBody(body);
            }

            if (cameraTarget) {
                lastPos = cameraTarget.position;
            }

            for (let body of simBodies) {
                body.force = sysTree.getForceVector(body, 0);
                body.updateAcceleration();
                body.updateVelocity(tStep);
                body.updatePosition(tStep);
                body.updateModel(tStep);
            }

            if (cameraTarget) {
                newPos = cameraTarget.position;
                delta = [newPos[0] - lastPos[0], newPos[1] - lastPos[1], newPos[2] - lastPos[2]];
            }

            const dist = Math.sqrt((newPos[0] - lastPos[0]) ** 2 + (newPos[1] - lastPos[1]) ** 2 + (newPos[2] - lastPos[2]) ** 2);

            simTime += tStep;
            console.log(simTime / 60 / 60);
        } else {
            delta = [0, 0, 0];
        }

        // flyControls.update(1);
        orbitControls.update();

        if (cameraTarget) {
            camera.position.x += delta[0];
            camera.position.y += delta[1];
            camera.position.z += delta[2];
            orbitControls.target = new THREE.Vector3(cameraTarget.position[0], cameraTarget.position[1], cameraTarget.position[2]);
        }

        // trackballControls.update();
        renderer.render(scene, camera);
    };

    render();
    console.log(scene.children);

    function avgRadius(obj) {
        return obj.dimensions.reduce((a, b) => a + b) / obj.dimensions.length;
    }

    function plotOrbit(obj, orbiting) {
        const newObj = new Body(obj);
        const elements = newObj.orbitalParams(orbiting);

        const xRadius = elements.semimajorAxis;
        const yRadius = xRadius * (1 - elements.eccentricity ** 2) ** (1 / 2);

        const center = (xRadius ** 2 - yRadius ** 2) ** (1 / 2);
        const xCenter = center * Math.cos(elements.argPeriapse + Math.PI);
        const yCenter = center * Math.sin(elements.argPeriapse + Math.PI);

        const ellipse = new THREE.EllipseCurve(xCenter, yCenter, xRadius, yRadius, 0, 2 * Math.PI, false, elements.argPeriapse);
        var points = ellipse.getPoints(360);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var orbitEllipse = new THREE.Line(geometry, material);
        var orbit = new THREE.Object3D();
        orbit.add(orbitEllipse);
        orbit.rotation.set(elements.inclination, 0, elements.longAscNode, 'ZYX');
        orbit.position.set(orbiting.position[0], orbiting.position[1], orbiting.position[2]);
        scene.add(orbit);
    }

    function addToScene(obj) {
        var rx = obj.dimensions[0];
        var ry = obj.dimensions[2];
        var rz = obj.dimensions[1];

        var yScale = ry / rx;
        var zScale = rz / rx;

        var px = obj.position[0];
        var py = obj.position[1];
        var pz = obj.position[2];

        var geometry = new THREE.SphereGeometry(rx, 32, 32);
        geometry.scale(1, yScale, zScale);
        geometry.rotateX(Math.PI / 2);

        var material = new THREE.MeshPhongMaterial();

        if (obj.color_map) {
            material.map = new THREE.TextureLoader().load(obj.color_map);
        }

        if (obj.bump_map) {
            material.bumpMap = new THREE.TextureLoader().load(obj.bump_map);
            material.bumpScale = obj.bump_scale;
        }

        if (obj.specular_map) {
            material.specularMap = new THREE.TextureLoader().load(obj.specular_map);
            material.shininess = 50;
            material.reflectivity = 1;
        }

        const object = new THREE.Object3D();
        const objectMesh = new THREE.Mesh(geometry, material);
        object.add(new THREE.AxesHelper(10000000));
        object.add(objectMesh);

        if (obj.id === 10) {
            var sunLight = new THREE.PointLight(0xffffff, 1);
            sunLight.position.set(obj.position[0], obj.position[1], obj.position[2]);
            sunLight.castShadow = true;
            object.add(sunLight);
            object.castShadow = false;
            object.receiveShadow = false;
            object.emissive = new THREE.Color(0xffffff);
            object.emissiveIntensity = 10;

            const spotLight1 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight1.position.set(obj.position[0] + 696340 * 10, obj.position[1], obj.position[2]);
            const spotLight2 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight2.position.set(obj.position[0] - 696340 * 10, obj.position[1], obj.position[2]);
            const spotLight3 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight3.position.set(obj.position[0], obj.position[1] + 696340 * 10, obj.position[2]);
            const spotLight4 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight4.position.set(obj.position[0], obj.position[1] - 696340 * 10, obj.position[2]);
            const spotLight5 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight5.position.set(obj.position[0], obj.position[1], obj.position[2] + 696340 * 10);
            const spotLight6 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight6.position.set(obj.position[0], obj.position[1], obj.position[2] - 696340 * 10);
            object.add(spotLight1);
            object.add(spotLight2);
            object.add(spotLight3);
            object.add(spotLight4);
            object.add(spotLight5);
            object.add(spotLight6);
        } else {
            object.castShadow = true;
            object.receiveShadow = true;
        }

        if (obj.ring_inner_radius) {
            addRings(obj, object);
        }

        if (obj.cloud_map) {
            addClouds(obj, object, rx, yScale, zScale);
        }

        // apply rotation from orbital inclination
        object.rotation.z = obj.long_asc;
        object.rotation.y = obj.inclination;

        // apply rotation from axial tilt
        object.rotation.z = obj.solstice_angle;
        object.rotation.x -= obj.axial_tilt;
        object.position.set(px, py, pz);

        // for Earth, apply rotation to align object according to time of day
        if (obj.id === 399) {
            object.rotation.z += Math.PI;
        }

        // for Moon, apply rotation to align correct side with Earth
        if (obj.id === 301) {
            const earth = getBodyById(399);
            const relX = earth.position[0] - obj.position[0];
            const relY = earth.position[1] - obj.position[1];
            const theta = Math.atan2(relY, relX);
            object.rotation.z += theta;
        }

        if (obj.id === 399) {
            obj2 = object;
        }

        // sceneBodies.push(object);
        obj.model = object;
        scene.add(object);
    }

    function lookAt(bodyId) {
        const targetBody = getBodyById(bodyId);
        const distance = avgRadius(targetBody);
        camera.position.set(targetBody.position[0] + 5 * distance, targetBody.position[1] + 5 * distance, targetBody.position[2] + distance);
        orbitControls.target = new THREE.Vector3(targetBody.position[0], targetBody.position[1], targetBody.position[2]);
        return targetBody;
    }

    function getBodyById(bodyId) {
        for (let body of simBodies) {
            if (body.id === bodyId) {
                return body;
            }
        }
        return null;
    }

    function addRings(body, sceneObject) {
        const ringGeometry = new THREE.RingBufferGeometry(body.ring_inner_radius, body.ring_outer_radius, 360);
        var pos = ringGeometry.attributes.position;
        var v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeometry.attributes.uv.setXY(i, v3.length() < (body.ring_inner_radius + body.ring_outer_radius) / 2 ? 1 : 0, 1);
        }
        const ringMaterial = new THREE.MeshPhongMaterial();
        ringMaterial.map = new THREE.TextureLoader().load(body.ring_color);
        ringMaterial.alphaMap = new THREE.TextureLoader().load(body.ring_transparency);
        ringMaterial.transparent = true;
        const ringDisc = new THREE.Mesh(ringGeometry, ringMaterial);
        ringDisc.material.side = THREE.DoubleSide;
        ringDisc.castShadow = true;
        ringDisc.receiveShadow = true;

        sceneObject.add(ringDisc);
    }

    function addClouds(body, sceneObject, rx, yScale, zScale) {
        const cloudGeometry = new THREE.SphereGeometry(rx + 10, 32, 32);
        cloudGeometry.scale(1, yScale, zScale);
        const cloudMaterial = new THREE.MeshPhongMaterial();
        cloudMaterial.map = new THREE.TextureLoader().load(body.cloud_map);
        cloudMaterial.alphaMap = new THREE.TextureLoader().load(body.cloud_transparency);
        cloudMaterial.transparent = true;
        const cloudSphere = new THREE.Mesh(cloudGeometry, cloudMaterial);

        sceneObject.add(cloudSphere);
    }

    $('#start').on('click', function () {
        go = true;
        tstart = true;
    });

    $('#look').on('click', function () {
        const bodyId = parseInt($('#body-id').val());
        cameraTarget = lookAt(bodyId);
    });

    $(window).on('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.updateProjectionMatrix();
    });

    // event listener for form submission
    $('#sim-select').on('submit', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        const date = $('#date').val();
        const time = $('#time').val();
        const bodySet = $('#object-set').val();

        clearScene();
        loadScene(date, time, bodySet);
    });

    // function to clear all objects from scene
    function clearScene() {
        const delObjects = [...scene.children]
        for (let body of delObjects) {
            if (body != background) {
                // remove all objects from scene except background
                scene.remove(body);
                const bodyObjects = [...body.children];
                for (let child of bodyObjects) {
                    if (child.constructor.name === 'Mesh') {
                        // dispose of materials, textures, and geometries
                        child.geometry.dispose();
                        try { child.material.map.dispose(); } catch {}
                        try { child.material.bumpMap.dispose(); } catch {}
                        try { child.material.alphaMap.dispose(); } catch {}
                        try { child.material.specularMap.dispose(); } catch {}
                        child.material.dispose();
                    }
                }
            }
        }
    }
});

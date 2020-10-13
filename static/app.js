import * as THREE from './node_modules/three/src/Three.js';
import { FlyControls } from './node_modules/three/examples/jsm/controls/FlyControls.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Mesh } from './node_modules/three/src/Three.js';

$(async function () {
    const G = 6.67408e-20 // km3/(kg*s2)

    const viewport = document.getElementById('viewport');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, (window.innerWidth) / (window.innerHeight), 0.0000000001, 2400000000000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    viewport.appendChild(renderer.domElement);

    const flyControls = new FlyControls(camera, viewport);
    flyControls.dragToLook = true;
    flyControls.movementSpeed = 1000;

    // const orbitControls = new OrbitControls(camera, viewport);
    // orbitControls.enableZoom = true;

    var skySphere = new THREE.SphereGeometry(24000000000, 256, 256);
    var milkyWay = new THREE.TextureLoader().load('/images/background/ESO_-_Milky_Way.jpg');
    milkyWay.anisotropy = renderer.capabilities.getMaxAnisotropy();
    milkyWay.flipY = false;
    var backgroundMaterial = new THREE.MeshBasicMaterial({ map: milkyWay });
    var background = new Mesh(skySphere, backgroundMaterial);
    background.material.side = THREE.BackSide;
    background.rotation.x = - (90 - 60) * (Math.PI / 180);
    scene.add(background);

    let obj1 = 0;
    let obj2 = 0;

    var axes = new THREE.AxesHelper(100000000000);
    scene.add(axes);

    var res = await axios.get(`http://127.0.0.1:5000/object/${10}`);
    var sun = res.data;

    res = await axios.get(`http://127.0.0.1:5000/object/${399}`);
    var sys = res.data;
    plotOrbit(sys, sun);
    const system = [sys];

    var sunLight = new THREE.PointLight(0xffffff, 1);
    sunLight.position.set(sun.position[0], sun.position[1], sun.position[2]);
    scene.add(sunLight);

    var starLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(starLight);

    system.unshift(sun);

    for (let obj of system) {
        addToScene(obj);
    }

    const cameraZPos = system[1].position[2] + avgRadius(system[1]) * 3
    camera.position.set(system[1].position[0], system[1].position[1], cameraZPos);
    // camera.position.set(0, 0, 0);    
    var render = function () {
        requestAnimationFrame(render);
        // object.rotation.x += 0.05;
        var newAcc = obj1.acceleration = accVector(system[0], system[1]);
        var newVel = obj1.updateVelocity(86400 / 2);
        var newPos = obj1.updatePosition(86400 / 2);

        // console.log(newAcc);
        // console.log(newVel);
        // console.log(newPos);

        console.log(Math.atan2(newPos[1], newPos[0]) * (180 / Math.PI));

        // obj2.rotation.z += 0.005;
        obj2.position.set(newPos[0], newPos[1], newPos[2]);
        camera.position.set(newPos[0], newPos[1], cameraZPos);
        // console.log(obj2.position);

        flyControls.update(1);
        // orbitControls.update();
        renderer.render(scene, camera);
    };

    // render();

    function avgRadius(obj) {
        return obj.dimensions.reduce((a, b) => a + b) / obj.dimensions.length;
    }

    function plotOrbit(obj, orbiting) {
        const newObj = new Planet(obj);

        if (obj.id === 399) {
            obj1 = newObj;
            console.log(obj1);
        }

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
        orbit.position.set(sun.position[0], sun.position[1], sun.position[2]);
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

        var geometry = new THREE.SphereGeometry(rx, 256, 256);
        geometry.scale(1, yScale, zScale);
        geometry.rotateX(Math.PI / 2);
        // geometry.scale(10, 10, 10);

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

        if (obj.id === 10) {
            obj.emissive = new THREE.Color(0xffffff);
            obj.emissiveIntensity = 10;
        }

        var object = new THREE.Mesh(geometry, material);
        object.add(new THREE.AxesHelper(10000000));

        // apply rotation from orbital inclination
        object.rotation.z = obj.long_asc;
        object.rotation.y = obj.inclination;

        // apply rotation from axial tilt
        object.rotation.z = obj.solstice_angle;
        object.rotation.x -= obj.axial_tilt;
        object.position.set(px, py, pz);

        if (obj.id === 399) {
            obj2 = object;
        }

        scene.add(object);
    }
});

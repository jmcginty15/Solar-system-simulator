import * as THREE from './node_modules/three/src/Three.js';
import { FlyControls } from './node_modules/three/examples/jsm/controls/FlyControls.js';

$(async function () {
    const viewport = document.getElementById('viewport');
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, (window.innerWidth) / (window.innerHeight), 0.0000000001, 1000000000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    viewport.appendChild(renderer.domElement);

    var controls = new FlyControls(camera, viewport);

    var light = new THREE.PointLight(0xffffff);
    light.position.set(-1000000, 2000000, 1000000);
    scene.add(light);

    var light2 = new THREE.PointLight(0xffffdd);
    light2.position.set(1000000, -20000000, -1000000);
    scene.add(light2);

    var obj_id = prompt('Enter object id:');
    // res = await axios.get(`http://127.0.0.1:5000/object/${10}`);
    // sun = res.data
    // res = await axios.get(`http://127.0.0.1:5000/object/${399}`);
    // earth = res.data
    var res = await axios.get(`http://127.0.0.1:5000/object/${obj_id}`);
    var moon = res.data
    console.log(moon);

    // objs = [sun, earth, moon]

    // for (let obj of objs) {
    var rx = moon.dimensions[0]
    var ry = moon.dimensions[1]
    var rz = moon.dimensions[2]

    var yScale = ry / rx
    var zScale = rz / rx

    // px = obj.position[0]
    // py = obj.position[1]
    // pz = obj.position[2]

    // for (let i = 0; i < 4; i++) {
    var geometry = new THREE.SphereGeometry(rx, 128, 128);
    geometry.scale(1, yScale, zScale);
    // geometry.scale(10000, 10000, 10000);
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var object = new THREE.Mesh(geometry, material);
    // object.position.set(0, 0, 20 * i);
    scene.add(object);
    // }
    // }

    camera.position.z = 100;

    var render = function () {
        requestAnimationFrame(render);

        object.rotation.x += 0.05;
        object.rotation.y += 0.05;

        renderer.render(scene, camera);
    };

    render();
});
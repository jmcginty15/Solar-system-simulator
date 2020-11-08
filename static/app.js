import * as THREE from './node_modules/three/src/Three.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Mesh, Vector3 } from './node_modules/three/src/Three.js';

$(async function () {
    // useful JQuery objects
    const $elapsedTime = $('#elapsed-time');
    const $currentTime = $('#current-time');
    const $framerateContainer = $('#framerate-container');
    const $playPauseButton = $('#play-pause');
    const $simSelectForm = $('#sim-select');
    const $objectInfo = $('#object-info');
    const $dateSelect = $('#date');
    const $timeSelect = $('#time');
    const $objectSetSelect = $('#object-set');
    const $speedSlider = $('#speed-slider');
    const $appInfo = $('#app-info');
    const $infoIcon = $('#info-icon');
    const $objectSelect = $('#object-select');
    const $closeButton = $('#close-button');
    const $closeButton2 = $('#close-button-2');
    const $developmentInfo = $('#development-info');
    const $aboutLink = $('#about-link');
    const $showHideButton = $('#show-hide-button');
    const $overlayClass = $('.overlay');
    const $showHideOverlay = $('#show-hide-overlay');
    const $loadingScreen = $('#loading-screen');

    // initialize some values we will need later
    // const BASE_URL = 'http://127.0.0.1:5000';
    const BASE_URL = 'https://solar-system-simulator.herokuapp.com/';
    let running = false;
    let overlayHidden = false;
    let startDate = new Date();
    let currentDate = new Date();
    let frameCountStart = new Date();
    let frameCount = 0;
    let elapsedTime = 0;
    let simSpeed = 1;
    let simBodies = [];
    let cameraTarget = null;
    resetTimer(startDate);

    // set up the scene and append it to the DOM
    const viewport = document.getElementById('viewport');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.0000000001, 240000000000000);
    camera.up = new THREE.Vector3(0, 0, 1);
    const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, physicallyCorrectLights: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = true;
    viewport.appendChild(renderer.domElement);

    // instantiate orbitControls and attach it to the viewport
    const orbitControls = new OrbitControls(camera, viewport);
    orbitControls.enableZoom = true;
    orbitControls.zoomSpeed = 2;

    // add a background texture to the scene
    var skySphere = new THREE.SphereGeometry(24000000000000, 32, 32);
    var milkyWay = new THREE.TextureLoader().load('/images/background/ESO_-_Milky_Way.jpg');
    milkyWay.anisotropy = renderer.capabilities.getMaxAnisotropy();
    milkyWay.flipY = false;
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: milkyWay });
    const background = new Mesh(skySphere, backgroundMaterial);
    background.material.side = THREE.BackSide;
    background.rotation.x = - (90 - 60) * (Math.PI / 180);
    scene.add(background);

    // start render loop
    render();
    // load default scene of all planets and dwarf planets at the system current date/time
    await loadScene(startDate, 'planets-dwarves');

    // render loop
    function render() {
        requestAnimationFrame(render);

        // these values will be used to move the camera with its current target
        let lastPos = [];
        let newPos = [];
        let delta = [];

        // this value will be used to display elapsed simulation time to the user
        let timeString = '';

        if (cameraTarget) {
            // position of the camera target before updating
            lastPos = cameraTarget.position;
        }

        if (running) {
            let loops = 1;
            let tStep = 60;
            let threshold = 0;

            if (simSpeed >= 1) {
                loops = simSpeed;
                threshold = (simSpeed + simBodies.length) / 323;
            } else {
                tStep = -1 / (simSpeed - 1);
            }

            for (let i = 0; i < loops; i++) {
                const sysTree = new Tree([-2e10, -2e10, -2e10], 4e10);

                for (let body of simBodies) {
                    if (body.available) {
                        sysTree.addBody(body);
                    }
                }

                for (let body of simBodies) {
                    if (body.available) {
                        body.force = sysTree.getForceVector(body, threshold);
                        body.updateAcceleration();
                        body.updateVelocity(tStep);
                        body.updatePosition(tStep);
                    }
                }

                const dist = Math.sqrt((newPos[0] - lastPos[0]) ** 2 + (newPos[1] - lastPos[1]) ** 2 + (newPos[2] - lastPos[2]) ** 2);

                currentDate = new Date(currentDate.getTime() + tStep * 1000);
            }

            for (let body of simBodies) {
                if (body.available) {
                    body.updateModel(tStep * loops);
                }
            }
        } else {
            delta = [0, 0, 0];
        }

        elapsedTime = currentDate - startDate;
        timeString = parseTime(elapsedTime);
        $elapsedTime.text(timeString);
        $currentTime.text(parseDateTime(currentDate));
        orbitControls.update();

        if (cameraTarget) {
            // if cameraTarget is a System, update its position and velocity
            if (cameraTarget instanceof System) {
                cameraTarget.updatePosition();
                cameraTarget.updateVelocity();
            }

            if (cameraTarget.id != 0 && cameraTarget.id != 10) {
                // if cameraTarget is not the full solar system or the sun, calculate and display its distance to the sun
                let sunDistance = cameraTarget.getDistance(simBodies[0]);
                let sunDistanceLabel = '';
                if (sunDistance >= 1e+6 && sunDistance < 1e+9) {
                    sunDistance /= 1e+6;
                    sunDistanceLabel = ' million';
                } else if (sunDistance >= 1e+9) {
                    sunDistance /= 1e+9;
                    sunDistanceLabel = ' billion';
                }
                sunDistance = +sunDistance.toFixed(2);
                $('#sun-distance').text(`${sunDistance + sunDistanceLabel} km`);

                const primaryId = parseInt(cameraTarget.id.toString()[0] + '99');
                if (primaryId === cameraTarget.id || cameraTarget instanceof System || [1, 136108, 136199, 136472].includes(cameraTarget.id)) {
                    // if cameraTarget is a planet, dwarf planet, or System,
                    // calculate and display its orbital speed relative to the sun
                    let speed = cameraTarget.getOrbitalSpeed(simBodies[0]);
                    speed = +speed.toFixed(2);
                    $('#orbital-speed').text(`${speed} km/s`);
                } else {
                    // if cameraTarget is a moon, calculate and display its orbital speed relative to its primary body
                    const primary = getBodyById(primaryId);

                    let primaryDistance = cameraTarget.getDistance(primary);
                    let primaryDistanceLabel = '';
                    if (primaryDistance >= 1e+6 && primaryDistance < 1e+9) {
                        primaryDistance /= 1e+6;
                        primaryDistanceLabel = ' million';
                    } else if (primaryDistance >= 1e+9) {
                        primaryDistance /= 1e+9;
                        sunDistanceLabel = ' billion';
                    }
                    primaryDistance = +primaryDistance.toFixed(2);
                    $('#primary-distance').text(`${primaryDistance + primaryDistanceLabel} km`);

                    let speed = cameraTarget.getOrbitalSpeed(primary);
                    speed = +speed.toFixed(2);
                    $('#orbital-speed').text(`${speed} km/s`);
                }
            }

            // position of the camera target after updating
            newPos = cameraTarget.position;
            // difference between old and new camera target positions
            delta = [newPos[0] - lastPos[0], newPos[1] - lastPos[1], newPos[2] - lastPos[2]];

            // update the camera's position and keep it pointing at the camera target
            camera.position.x += delta[0];
            camera.position.y += delta[1];
            camera.position.z += delta[2];
            orbitControls.target = new THREE.Vector3(cameraTarget.position[0], cameraTarget.position[1], cameraTarget.position[2]);
        }

        renderer.render(scene, camera);

        // measure and display framerate
        let frameCountCurrent = new Date();
        if (frameCountCurrent - frameCountStart >= 1000) {
            let fps = frameCount / ((frameCountCurrent - frameCountStart) / 1000);
            if (fps >= 45) {
                $framerateContainer.css('color', 'green');
            } else if (fps >= 30) {
                $framerateContainer.css('color', 'yellow');
            } else {
                $framerateContainer.css('color', 'red');
            }
            fps = fps.toFixed(2);
            $framerateContainer.text(`${fps} fps`);
            frameCountStart = new Date();
            frameCount = 0;
        } else {
            frameCount += 1;
        }
    };

    // create a THREE.js object for the given body and add it to the scene
    function addToScene(body) {
        const rx = body.dimensions[0];
        const ry = body.dimensions[2];
        const rz = body.dimensions[1];

        const yScale = ry / rx;
        const zScale = rz / rx;

        const px = body.position[0];
        const py = body.position[1];
        const pz = body.position[2];

        // create a sphere geometry and scale it according to the body's dimensions
        const geometry = new THREE.SphereGeometry(rx, 24, 24);
        geometry.scale(1, yScale, zScale);
        geometry.rotateX(Math.PI / 2);

        // create the material for the object
        const material = new THREE.MeshPhongMaterial();

        // if body has a texture map, add it to the material
        if (body.color_map) {
            material.map = new THREE.TextureLoader().load(body.color_map);
        }

        // if body has a bump map, add it to the material
        if (body.bump_map) {
            material.bumpMap = new THREE.TextureLoader().load(body.bump_map);
            material.bumpScale = body.bump_scale;
        }

        // if body has a specular map, add it to the material
        if (body.specular_map) {
            material.specularMap = new THREE.TextureLoader().load(body.specular_map);
            material.shininess = 50;
            material.reflectivity = 1;
        }

        // create a new mesh from the geometry and material and add it to a new Object3D
        const object = new THREE.Object3D();
        const objectMesh = new THREE.Mesh(geometry, material);
        objectMesh.castShadow = true;
        objectMesh.receiveShadow = true;
        object.add(objectMesh);

        // for the Sun, add spotlights to illuminate the sun and a point light as the light source for the system
        if (body.id === 10) {
            const sunLight = new THREE.PointLight(0xffffff, 1);
            sunLight.castShadow = true;
            object.add(sunLight);
            console.log(sunLight);
            objectMesh.castShadow = false;
            objectMesh.receiveShadow = false;
            object.emissive = new THREE.Color(0xffffff);
            object.emissiveIntensity = 10;

            const spotLight1 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight1.position.set(696340 * 10, 0, 0);
            const spotLight2 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight2.position.set(-696340 * 10, 0, 0);
            const spotLight3 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight3.position.set(0, 696340 * 10, 0);
            const spotLight4 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight4.position.set(0, -696340 * 10, 0);
            const spotLight5 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight5.position.set(0, 0, 696340 * 10);
            const spotLight6 = new THREE.SpotLight(0xffffff, 10, 696340 * 15, Math.PI / 2);
            spotLight6.position.set(0, 0, -696340 * 10);
            object.add(spotLight1);
            object.add(spotLight2);
            object.add(spotLight3);
            object.add(spotLight4);
            object.add(spotLight5);
            object.add(spotLight6);
        }

        // if the body has rings, call the function to add them
        if (body.ring_inner_radius) {
            addRings(body, object);
        }

        // if the body has a texture for a cloud map, call the function to add it
        if (body.cloud_map) {
            addClouds(body, object, rx, yScale, zScale);
        }

        // apply rotation from orbital inclination
        object.rotation.z = body.long_asc;
        object.rotation.y = body.inclination;

        // apply rotation from axial tilt
        object.rotation.z = body.solstice_angle;
        object.rotation.x -= body.axial_tilt;

        // set the body's position
        object.position.set(px, py, pz);

        // for Earth, apply rotation to align object according to time of day
        if (body.id === 399) {
            const sun = getBodyById(10);
            const relX = sun.position[0] - body.position[0];
            const relY = sun.position[1] - body.position[1];
            const theta = Math.atan2(relY, relX);
            const time = startDate.getUTCHours() + startDate.getUTCMinutes() / 60 + startDate.getUTCSeconds() / 3600;
            const timeFraction = time / 24;
            object.rotation.z += theta + (Math.PI / 2) + (2 * Math.PI * timeFraction) - Math.PI;
        }

        // for Moon, apply rotation to align correct side with Earth
        if (body.id === 301) {
            const earth = getBodyById(399);
            const relX = earth.position[0] - body.position[0];
            const relY = earth.position[1] - body.position[1];
            const theta = Math.atan2(relY, relX);
            object.rotation.z += theta;
        }

        // set the newly created THREE.js object as the body's model 
        body.model = object;
        scene.add(object);
    }

    // points the camera at the body or system with the given id
    // returns the body or system to be set as the cameraTarget
    function lookAt(bodyId) {
        const targetBody = getBodyById(bodyId);

        // if target is a body, set it as the camera target
        if (targetBody) {
            // position the camera between the body and the system to give a good view
            const theta = Math.atan2(simBodies[0].position[1] - targetBody.position[1], simBodies[0].position[0] - targetBody.position[0]) - Math.PI / 4;
            const distance = avgRadius(targetBody);
            camera.position.set(targetBody.position[0] + 5 * distance * Math.cos(theta), targetBody.position[1] + 5 * distance * Math.sin(theta), targetBody.position[2] + distance);

            // point the camera at the body
            orbitControls.target = new THREE.Vector3(targetBody.position[0], targetBody.position[1], targetBody.position[2]);
            orbitControls.minDistance = distance * 2;
            return targetBody;
        } else {
            // if target is not a body, getBodyById will return null
            // and we will set the camera target to the selected system barycenter

            // first, construct the list of bodies in the system
            let systemBodies = [];
            if (bodyId === 0) {
                systemBodies = simBodies;
            } else {
                for (let body of simBodies) {
                    if (body.id.toString()[0] === bodyId.toString()) {
                        systemBodies.push(body);
                    }
                }
            }

            // create a new System and calculate its position and velocity
            const system = new System(bodyId, systemBodies);
            system.updatePosition();
            system.updateVelocity();

            // position the camera between the sun and the system
            const theta = Math.atan2(simBodies[0].position[1] - system.position[1], simBodies[0].position[0] - system.position[0]) - Math.PI / 4;
            const distance = system.radius;
            camera.position.set(system.position[0] + 1.25 * distance * Math.cos(theta), system.position[1] + 1.25 * distance * Math.sin(theta), system.position[2] + 0.5 * distance);

            // point the camera at the system barycenter
            orbitControls.target = new THREE.Vector3(system.position[0], system.position[1], system.position[2]);
            orbitControls.minDistance = (avgRadius(system.primary) + Math.sqrt((system.position[0] - system.primary.position[0]) ** 2 + (system.position[1] - system.primary.position[1]) ** 2 + (system.position[2] - system.primary.position[2]) ** 2)) * 2;
            return system;
        }
    }

    // returns the body with the given id
    function getBodyById(bodyId) {
        for (let body of simBodies) {
            if (body.id === bodyId) {
                return body;
            }
        }
        return null;
    }

    // adds rings to the given sceneObject
    function addRings(body, sceneObject) {
        // create a ring geometry
        const ringGeometry = new THREE.RingBufferGeometry(body.ring_inner_radius, body.ring_outer_radius, 360);
        const pos = ringGeometry.attributes.position;
        const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeometry.attributes.uv.setXY(i, v3.length() < (body.ring_inner_radius + body.ring_outer_radius) / 2 ? 1 : 0, 1);
        }

        // create a ring material
        const ringMaterial = new THREE.MeshPhongMaterial();

        // if the body has a ring color map, add it to the material
        if (body.ring_color) {
            ringMaterial.map = new THREE.TextureLoader().load(body.ring_color);
        }

        // if the body has a ring transparency map, add it to the material
        if (body.ring_transparency) {
            ringMaterial.alphaMap = new THREE.TextureLoader().load(body.ring_transparency);
        } else {
            ringMaterial.opacity = 0.5;
        }
        ringMaterial.transparent = true;

        // create a mesh of the geometry and material
        const ringDisc = new THREE.Mesh(ringGeometry, ringMaterial);
        ringDisc.material.side = THREE.DoubleSide;
        ringDisc.castShadow = true;
        ringDisc.receiveShadow = true;

        // add the mesh to the body
        sceneObject.add(ringDisc);
    }

    // add a cloud layer to the given sceneObject
    function addClouds(body, sceneObject, rx, yScale, zScale) {
        // create a new sphere geometry 10km larger than the parent body
        const cloudGeometry = new THREE.SphereGeometry(rx + 10, 24, 24);
        // scale it according to the parent body's scale
        cloudGeometry.scale(1, yScale, zScale);

        // create a new material for the cloud layer and add a color map and alpha map
        const cloudMaterial = new THREE.MeshPhongMaterial();
        cloudMaterial.map = new THREE.TextureLoader().load(body.cloud_map);
        cloudMaterial.alphaMap = new THREE.TextureLoader().load(body.cloud_transparency);
        cloudMaterial.transparent = true;

        // create a mesh from the geometry and material and align it to the parent body
        const cloudSphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudSphere.rotation.x = Math.PI / 2;

        // add the mesh to the body
        sceneObject.add(cloudSphere);
    }

    // event listener for play-pause button
    $playPauseButton.on('click', function () {
        if (running) {
            running = false;
            $playPauseButton.html('&#9205');
        } else {
            $playPauseButton.html('&#9208');
            running = true;
            tstart = true;
        }
    });

    // event listener for window resize
    $(window).on('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.updateProjectionMatrix();
    });

    // event listener for form submission
    $simSelectForm.on('submit', async function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        running = false;
        cameraTarget = null;
        $playPauseButton.html('&#9205');
        $objectInfo.html('<h4>No object selected</h4>');

        const date = $dateSelect.val();
        const time = $timeSelect.val();
        const bodySet = $objectSetSelect.val();

        startDate = new Date(`${date}T${time}`);
        currentDate = new Date(`${date}T${time}`);

        clearScene();
        resetTimer(startDate);
        await loadScene(startDate, bodySet);
    });

    // event listener for range slider change
    $speedSlider.on('change', function () {
        simSpeed = parseInt($speedSlider.val());
    });

    // event listener for expanding and collapsing system selection lists and viewing objects
    $objectSelect.on('click', function (evt) {
        const $target = $(evt.target);

        if ($target.hasClass('object-selector')) {
            const id = $target.attr('id');

            cameraTarget = lookAt(parseInt(id));
            if (cameraTarget instanceof Body) {
                const primaryId = parseInt(cameraTarget.id.toString()[0] + '99');
                let primary = null;
                if (cameraTarget.id != primaryId && ![10, 1, 136108, 136199, 136472].includes(cameraTarget.id)) {
                    primary = getBodyById(primaryId);
                }
                updateObjectInfo(cameraTarget, simBodies[0], primary);
            } else {
                updateSystemInfo(cameraTarget, simBodies[0]);
            }
        } else if ($target.parent().hasClass('system-selector')) {
            const $li = $target.parent().parent();

            if ($li.hasClass('collapsed')) {
                $li.removeClass('collapsed');
                const $icon = $li.find('.icon');
                $icon.html('&#9652');

                for (let item of $li.find('li')) {
                    const $item = $(item);
                    $item.removeClass('hidden');
                }
            } else {
                $li.addClass('collapsed');
                const $icon = $li.find('.icon');
                $icon.html('&#9662');

                for (let item of $li.find('li')) {
                    const $item = $(item);
                    $item.addClass('hidden');
                }
            }
        }
    });

    // event listener for info icon
    $infoIcon.on('click', function () {
        $appInfo.show();
    });

    // event listener for closing app-info
    $closeButton.on('click', function () {
        $appInfo.hide();
    });

    // event listener for development info button
    $aboutLink.on('click', function () {
        $appInfo.hide();
        $developmentInfo.show();
    });

    // event listener for closing development-info
    $closeButton2.on('click', function () {
        $developmentInfo.hide();
    });

    // event listener for showing or hiding overlay
    $showHideButton.on('click', function () {
        if (overlayHidden) {
            $overlayClass.show();
            $showHideOverlay.css({ left: '23%' });
            $showHideButton.text('Hide overlay');
            overlayHidden = false;
        } else {
            $overlayClass.hide();
            $showHideOverlay.css({ left: '0%' });
            $showHideButton.text('Show overlay');
            overlayHidden = true;
        }
    })

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
                        try { child.material.map.dispose(); } catch { }
                        try { child.material.bumpMap.dispose(); } catch { }
                        try { child.material.alphaMap.dispose(); } catch { }
                        try { child.material.specularMap.dispose(); } catch { }
                        child.material.dispose();
                    }
                }
            }
        }
        simBodies = [];
    }

    // function to load new scene
    async function loadScene(datetime, bodySet) {
        $loadingScreen.show();

        const year = datetime.getUTCFullYear();
        const month = datetime.getUTCMonth() + 1;
        const day = datetime.getUTCDate();
        const hour = datetime.getUTCHours();
        const minute = datetime.getUTCMinutes();
        const second = datetime.getUTCSeconds();

        // get body list and set camera target for after scene is loaded
        let bodyList = null;
        let newCameraTarget = null;
        if (bodySet === 'full') {
            bodyList = FULL;
            newCameraTarget = 0;
        } else if (bodySet === 'inner') {
            bodyList = INNER;
            newCameraTarget = 0;
        } else if (bodySet === 'outer') {
            bodyList = OUTER;
            newCameraTarget = 0;
        } else if (bodySet === 'planets') {
            bodyList = PLANETS;
            newCameraTarget = 0;
        } else if (bodySet === 'dwarves') {
            bodyList = DWARVES;
            newCameraTarget = 0;
        } else if (bodySet === 'planets-dwarves') {
            bodyList = PLANETS_DWARVES;
            newCameraTarget = 0;
        } else if (bodySet === '3') {
            bodyList = EARTH_MOON_SYS;
            newCameraTarget = 3;
        } else if (bodySet === '4') {
            bodyList = MARTIAN_SYS;
            newCameraTarget = 4;
        } else if (bodySet === '5') {
            bodyList = JOVIAN_SYS;
            newCameraTarget = 5;
        } else if (bodySet === '6') {
            bodyList = SATURNIAN_SYS;
            newCameraTarget = 6;
        } else if (bodySet === '7') {
            bodyList = URANIAN_SYS;
            newCameraTarget = 7;
        } else if (bodySet === '8') {
            bodyList = NEPTUNIAN_SYS;
            newCameraTarget = 8;
        } else if (bodySet === '9') {
            bodyList = PLUTONIAN_SYS;
            newCameraTarget = 9;
        }

        let systemBox = true;
        $('#object-system-container').html('<b id="system-container" class="left-float"></b><em id="object-container" class="right-float"></em>');
        if (['planets', 'dwarves', 'planets-dwarves'].includes(bodySet)) {
            systemBox = false;
            $('#object-system-container').empty();
        }

        const totalObjects = bodyList.length;
        let i = 0;
        for (let queryObj of bodyList) {
            // display loading information to the user while objects are being queried
            if (systemBox) {
                if (queryObj.sysName) {
                    $('#system-container').text(queryObj.sysName);
                } else {
                    $('#system-container').empty();
                }
                $('#object-container').text(queryObj.name);
            } else {
                $('#object-system-container').text(queryObj.name);
            }

            // get request to the flask server for next object
            const res = await axios.get(`${BASE_URL}/bodies/${queryObj.id}`, {
                params: {
                    'year': year,
                    'month': month,
                    'day': day,
                    'hour': hour,
                    'minute': minute,
                    'second': second,
                }
            });
            const body = res.data;

            // create a new Body and add it to the scene if available
            const nextBody = new Body(body);
            simBodies.push(nextBody);
            if (body.available) {
                addToScene(nextBody);
            }

            i += 1;
            let percentage = (i / totalObjects) * 100;
            $('#finished-bar').width(`${percentage}%`);
            $('#percent-indicator').text(`${+percentage.toFixed(2)}%`);
        }

        resetLoadingScreen();
        loadSelectList(bodySet, simBodies);
        cameraTarget = lookAt(newCameraTarget);
        updateSystemInfo(cameraTarget, simBodies[0]);
    }
});

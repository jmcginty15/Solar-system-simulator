three-fly-controls
===========================

Three.js fly controls, adapted from http://threejs.org/examples/js/controls/FlyControls.js



## usage

```npm install three-fly-controls```

```js

var THREE = require('three.js');

// Add the plugin
require('three-fly-controls')(THREE);


// build your THREE.js scene


THREE.FlyControls(cameraObject, domElement);
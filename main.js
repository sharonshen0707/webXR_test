import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

// --------------------
// 1. 建立 Scene
// --------------------

const scene = new THREE.Scene();


// --------------------
// 2. 建立 Camera
// --------------------

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);


// --------------------
// 3. 建立 Renderer
// --------------------

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);


// --------------------
// 4. 建立 AR Button
// --------------------

document.body.appendChild(
  ARButton.createButton(renderer)
);


// --------------------
// 5. 建立一個 3D 方塊
// --------------------

const geometry = new THREE.BoxGeometry(
  0.2,
  0.2,
  0.2
);

const material = new THREE.MeshBasicMaterial({
  color: 0xff0000
});

const cube = new THREE.Mesh(
  geometry,
  material
);


// --------------------
// 6. 把方塊放到前方
// --------------------

cube.position.set(
  0,
  0,
  -1
);

scene.add(cube);


// --------------------
// 7. Render Loop
// --------------------

renderer.setAnimationLoop(() => {

  renderer.render(scene, camera);

});


// --------------------
// 8. 視窗大小改變
// --------------------

window.addEventListener('resize', () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

});
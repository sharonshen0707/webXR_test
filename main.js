import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

// ========================================
// 1. Scene
// ========================================
const scene = new THREE.Scene();

// ========================================
// 2. Camera
// ========================================
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);

// ========================================
// 3. Renderer
// ========================================
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

// ========================================
// 4. AR Button
// ========================================
const arButton = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test']
});

document.body.appendChild(arButton);

// ========================================
// 5. 建立紅色 Cube
// ========================================
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

// 一開始不要顯示
cube.visible = false;

scene.add(cube);

// ========================================
// 6. Hit Test 相關變數
// ========================================

let hitTestSource = null;
let hitTestSourceRequested = false;

// Cube 是否已經被使用者放置
let cubePlaced = false;

// ========================================
// 7. 點擊畫面
// ========================================

window.addEventListener('click', () => {

  // 如果還沒有找到 Hit Test Source
  if (!hitTestSource) {
    console.log('尚未偵測到 AR 地面');
    return;
  }

  // 鎖定目前 Cube 的位置
  cubePlaced = true;

  console.log('Cube 已放置並鎖定');
});

// ========================================
// 8. WebXR Render Loop
// ========================================

renderer.setAnimationLoop((timestamp, frame) => {

  // 沒有 AR frame 時
  if (!frame) {
    renderer.render(scene, camera);
    return;
  }

  const session = renderer.xr.getSession();

  // ========================================
  // 第一次建立 Hit Test Source
  // ========================================

  if (!hitTestSourceRequested) {

    session.requestReferenceSpace('viewer')
      .then((referenceSpace) => {

        return session.requestHitTestSource({
          space: referenceSpace
        });

      })
      .then((source) => {

        hitTestSource = source;

      })
      .catch((error) => {

        console.error(
          '建立 Hit Test Source 失敗:',
          error
        );

      });

    // 建立 AR 世界的 Reference Space
    session.requestReferenceSpace('local')
      .then((referenceSpace) => {

        renderer.xr.setReferenceSpace(
          referenceSpace
        );

      })
      .catch((error) => {

        console.error(
          '建立 Reference Space 失敗:',
          error
        );

      });

    hitTestSourceRequested = true;
  }

  // ========================================
  // Hit Test
  // ========================================

  if (hitTestSource && !cubePlaced) {

    const referenceSpace =
      renderer.xr.getReferenceSpace();

    const hitTestResults =
      frame.getHitTestResults(
        hitTestSource
      );

    // 找到地面
    if (hitTestResults.length > 0) {

      const hit = hitTestResults[0];

      const pose =
        hit.getPose(referenceSpace);

      if (pose) {

        // 取得地面位置
        const position =
          pose.transform.position;

        // 把 Cube 放到地面上
        cube.position.set(
          position.x,
          position.y + 0.1,
          position.z
        );

        // 顯示 Cube
        cube.visible = true;
      }
    }
  }

  // ========================================
  // Render
  // ========================================

  renderer.render(
    scene,
    camera
  );
});

// ========================================
// 9. 視窗大小改變
// ========================================

window.addEventListener('resize', () => {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});
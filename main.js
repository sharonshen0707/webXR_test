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

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

// ========================================
// 4. AR Button
// ========================================

const arButton = ARButton.createButton(renderer, {
  requiredFeatures: [
    'local',
    'hit-test'
  ]
});

document.body.appendChild(arButton);

// ========================================
// 5. 建立綠色偵測圈
// ========================================

const ringGeometry = new THREE.RingGeometry(
  0.08,
  0.12,
  32
);

const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide
});

const reticle = new THREE.Mesh(
  ringGeometry,
  ringMaterial
);

// 讓圓圈水平躺在地面
reticle.rotation.x = -Math.PI / 2;

// 一開始隱藏
reticle.visible = false;

scene.add(reticle);

// ========================================
// 6. Hit Test 變數
// ========================================

let hitTestSource = null;
let hitTestSourceRequested = false;

// ========================================
// 7. AR Session 開始
// ========================================

renderer.xr.addEventListener(
  'sessionstart',
  () => {

    console.log('AR Session started');

    hitTestSource = null;
    hitTestSourceRequested = false;

    reticle.visible = false;
  }
);

// ========================================
// 8. AR Session 結束
// ========================================

renderer.xr.addEventListener(
  'sessionend',
  () => {

    console.log('AR Session ended');

    if (hitTestSource) {
      hitTestSource.cancel();
    }

    hitTestSource = null;
    hitTestSourceRequested = false;

    reticle.visible = false;
  }
);

// ========================================
// 9. Render Loop
// ========================================

renderer.setAnimationLoop(
  (timestamp, frame) => {

    // 非 AR 狀態
    if (!frame) {

      renderer.render(
        scene,
        camera
      );

      return;
    }

    const session =
      renderer.xr.getSession();

    // ====================================
    // 建立 Hit Test Source
    // ====================================

    if (!hitTestSourceRequested) {

      hitTestSourceRequested = true;

      console.log(
        '正在建立 Hit Test Source...'
      );

      session
        .requestReferenceSpace('viewer')
        .then(
          (viewerSpace) => {

            console.log(
              'Viewer space OK'
            );

            return session.requestHitTestSource({
              space: viewerSpace
            });
          }
        )
        .then(
          (source) => {

            hitTestSource = source;

            console.log(
              'Hit Test Source OK'
            );
          }
        )
        .catch(
          (error) => {

            console.error(
              'Hit Test 失敗:',
              error
            );
          }
        );
    }

    // ====================================
    // 執行 Hit Test
    // ====================================

    if (hitTestSource) {

      const referenceSpace =
        renderer.xr.getReferenceSpace();

      if (!referenceSpace) {

        renderer.render(
          scene,
          camera
        );

        return;
      }

      const results =
        frame.getHitTestResults(
          hitTestSource
        );

      // ==================================
      // 有偵測到平面
      // ==================================

      if (results.length > 0) {

        const hit =
          results[0];

        const pose =
          hit.getPose(
            referenceSpace
          );

        if (pose) {

          const position =
            pose.transform.position;

          reticle.position.set(
            position.x,
            position.y,
            position.z
          );

          reticle.visible = true;

        }

      } else {

        // 沒有偵測到平面
        reticle.visible = false;
      }
    }

    // ====================================
    // Render
    // ====================================

    renderer.render(
      scene,
      camera
    );
  }
);

// ========================================
// 10. Resize
// ========================================

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);
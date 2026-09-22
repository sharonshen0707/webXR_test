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
  requiredFeatures: ['hit-test']
});

document.body.appendChild(arButton);

// ========================================
// 5. 建立「地面偵測點」
// ========================================
//
// 先不用 Cube
// 用一個綠色圓圈表示「偵測到地面」
//

const reticleGeometry =
  new THREE.RingGeometry(
    0.08,
    0.12,
    32
  );

const reticleMaterial =
  new THREE.MeshBasicMaterial({
    color: 0x00ff00
  });

const reticle =
  new THREE.Mesh(
    reticleGeometry,
    reticleMaterial
  );

// 圓圈水平放置
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

    console.log('====================');
    console.log('AR Session 開始');
    console.log('====================');

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

    console.log('AR Session 結束');

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

    // 沒有 AR frame
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

      console.log(
        '正在建立 Hit Test Source...'
      );

      session
        .requestReferenceSpace('viewer')
        .then(
          (referenceSpace) => {

            console.log(
              'viewer reference space OK'
            );

            return session.requestHitTestSource({
              space: referenceSpace
            });

          }
        )
        .then(
          (source) => {

            hitTestSource = source;

            console.log(
              'Hit Test Source 建立成功'
            );

          }
        )
        .catch(
          (error) => {

            console.error(
              'Hit Test 建立失敗:',
              error
            );

          }
        );

      hitTestSourceRequested = true;
    }

    // ====================================
    // 執行 Hit Test
    // ====================================

    if (hitTestSource) {

      const referenceSpace =
        renderer.xr.getReferenceSpace();

      // 如果 reference space 還沒準備好
      if (!referenceSpace) {

        renderer.render(
          scene,
          camera
        );

        return;
      }

      const hitTestResults =
        frame.getHitTestResults(
          hitTestSource
        );

      // ==================================
      // 找到地面
      // ==================================

      if (
        hitTestResults.length > 0
      ) {

        const hit =
          hitTestResults[0];

        const pose =
          hit.getPose(
            referenceSpace
          );

        if (pose) {

          const position =
            pose.transform.position;

          // 綠色圓圈放到地面
          reticle.position.set(
            position.x,
            position.y,
            position.z
          );

          reticle.visible = true;

          console.log(
            '找到地面:',
            position.x,
            position.y,
            position.z
          );
        }

      } else {

        // 還沒有找到地面
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
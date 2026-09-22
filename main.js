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
// 5. 建立 Cube
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

cube.visible = false;

scene.add(cube);

// ========================================
// 6. Hit Test 變數
// ========================================

let hitTestSource = null;
let hitTestSourceRequested = false;

// 是否已經放置 Cube
let cubePlaced = false;

// ========================================
// 7. AR Session 開始
// ========================================

renderer.xr.addEventListener(
  'sessionstart',
  () => {

    console.log('AR Session 開始');

    // 每次重新進入 AR 都重新設定
    hitTestSource = null;
    hitTestSourceRequested = false;
    cubePlaced = false;

    cube.visible = false;
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

    cubePlaced = false;
    cube.visible = false;
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

      session
        .requestReferenceSpace('viewer')
        .then((referenceSpace) => {

          return session.requestHitTestSource({
            space: referenceSpace
          });

        })
        .then((source) => {

          hitTestSource = source;

          console.log(
            'Hit Test Source 建立成功'
          );

        })
        .catch((error) => {

          console.error(
            'Hit Test Source 建立失敗:',
            error
          );

        });

      // AR 世界座標
      session
        .requestReferenceSpace('local')
        .then((referenceSpace) => {

          renderer.xr.setReferenceSpace(
            referenceSpace
          );

        })
        .catch((error) => {

          console.error(
            'Reference Space 建立失敗:',
            error
          );

        });

      hitTestSourceRequested = true;
    }

    // ====================================
    // Hit Test
    // ====================================

    if (
      hitTestSource &&
      !cubePlaced
    ) {

      const referenceSpace =
        renderer.xr.getReferenceSpace();

      const hitTestResults =
        frame.getHitTestResults(
          hitTestSource
        );

      // 找到地面
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

          // Cube 顯示在偵測到的地面
          cube.position.set(
            position.x,
            position.y + 0.1,
            position.z
          );

          cube.visible = true;
        }
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
// 10. AR Select Event
// ========================================
//
// WebXR AR 中，使用者點擊畫面通常會觸發
// session 的 "select" event
//

renderer.xr.addEventListener(
  'sessionstart',
  () => {

    const session =
      renderer.xr.getSession();

    session.addEventListener(
      'select',
      () => {

        console.log(
          '收到 AR Select 事件'
        );

        // 如果 Cube 已經放置
        if (cubePlaced) {
          return;
        }

        // 沒有找到地面
        if (!hitTestSource) {

          console.log(
            '目前還沒有找到地面'
          );

          return;
        }

        // 鎖定 Cube
        cubePlaced = true;

        cube.visible = true;

        console.log(
          'Cube 已經固定在目前位置'
        );
      }
    );
  }
);

// ========================================
// 11. 視窗大小改變
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
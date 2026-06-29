import * as THREE from 'three';

// --- 1. シーン・カメラ・レンダラーの初期化 ---
const canvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 青空の色

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// --- 2. 環境の構築 (地面と光) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// 地面（グリッド）を置いて進んでいる感覚を出す
const gridHelper = new THREE.GridHelper(2000, 100, 0x000000, 0x444444);
gridHelper.position.y = -50; // 飛行機より下に配置
scene.add(gridHelper);

// --- 3. 飛行機（仮のオブジェクト）の作成 ---
// 本来はここにGLTFモデルなどを読み込みますが、今回は赤い箱で代用
const geometry = new THREE.BoxGeometry(2, 1, 4); // 横幅, 高さ, 全長
const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const airplane = new THREE.Mesh(geometry, material);
scene.add(airplane);

// --- 4. フライトパラメータと操作状態 ---
const flightState = {
  speed: 0.5,       // 前進速度 (フレーム毎)
  pitchSpeed: 0.02, // ピッチ（上下）の回転速度
};

const controls = {
  up: false,
  down: false,
};

// キーボード入力の監視
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') controls.up = true;
  if (e.key === 'ArrowDown') controls.down = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') controls.up = false;
  if (e.key === 'ArrowDown') controls.down = false;
});

// --- 5. メインのループ処理（ゲームループ） ---
function animate() {
  requestAnimationFrame(animate);

  // 1. キー入力に応じて機首の角度（ピッチ）を変更
  if (controls.up) {
    airplane.rotation.x -= flightState.pitchSpeed; // 機首を上げる
  }
  if (controls.down) {
    airplane.rotation.x += flightState.pitchSpeed; // 機首を下げる
  }

  // 2. 【重要】飛行機が「向いている方向」ベクトルを取得
  const direction = new THREE.Vector3();
  airplane.getWorldDirection(direction);
  
  // Three.jsのデフォルトの向きの仕様上、逆向き（前方）にするために -1 をかける
  direction.multiplyScalar(-1); 

  // 3. 向いている方向に速度を掛け合わせて移動させる（前進 ＋ 上昇/下降）
  airplane.position.addScaledVector(direction, flightState.speed);

  // 4. カメラを飛行機の後ろに追従させる（三人称視点）
  const relativeCameraOffset = new THREE.Vector3(0, 5, 15); // 飛行機からの相対位置（上、後ろ）
  const cameraOffset = relativeCameraOffset.applyMatrix4(airplane.matrixWorld);
  camera.position.copy(cameraOffset);
  camera.lookAt(airplane.position); // 常に飛行機を見つめる

  renderer.render(scene, camera);
}

// 画面サイズ変更への対応
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// シミュレーション開始
animate();
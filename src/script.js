import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import monstersJson from "../static/data/monsters.json";

import { MemoryGameObject } from "./gameObject";
import { Platform } from "./platform";

/**
 * Base
 */
var queryString = window.location.search;
var queryParams = new URLSearchParams(queryString);
const count = Number(queryParams.get("count")) ?? 6;

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Game logic
 */
let selected = [];
let gameStatus = "selecting";

function isPair() {
  const { x: x1, z: z1 } = selected[0].platform[0].object.position;
  const { x: x2, z: z2 } = selected[1].platform[0].object.position;

  if (x1 === x2 && z1 === z2) {
    return false;
  }

  const model1 = selected[0].model.getScene();
  const model2 = selected[1].model.getScene();

  return model1.modelName === model2.modelName;
}

function handleWinOrLose() {
  const pair = isPair();

  const { x: x1, z: z1 } = selected[0].platform[0].object.position;
  const { x: x2, z: z2 } = selected[1].platform[0].object.position;

  const { box: box1, platform: platform1 } = placedGameModels[x1][z1];
  const { box: box2, platform: platform2 } = placedGameModels[x2][z2];

  if (pair) {
    platform1.mesh.material.color.set("#00FF00");
    platform2.mesh.material.color.set("#00FF00");

    box1.gameStatus = "win";
    box2.gameStatus = "win";

    return;
  }

  box1.gameStatus = "lost";
  box2.gameStatus = "lost";
  platform1.mesh.material.color.set("#FF0000");
  platform2.mesh.material.color.set("#FF0000");

  setTimeout(() => {
    box1.gameStatus = "idle";
    box2.gameStatus = "idle";
  }, 2000);
}

function selectModel(platform, model) {
  const objectToAdd = {
    platform,
    model,
  };

  if (platform[0].object.gameStatus === "win") {
    return;
  }

  if (selected.length === 2) {
    selected = [objectToAdd];
    selected[0].platform[0].object.gameStatus = "selected";
    return;
  } else {
    selected.push(objectToAdd);
    selected[0].platform[0].object.gameStatus = "selected";
  }

  if (selected.length === 2) {
    gameStatus = "revealed";
    handleWinOrLose();
    return;
  }
}

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let placedGameModels = {};
let gameModels = [];
const boxModels = [];

const monsters = JSON.parse(JSON.stringify(monstersJson));
monsters.sort(() => Math.random() - 0.5); //shuffle the array

const monstersLimited = monsters.slice(0, count / 2);

let platformMesh;
let boxMesh;

function parseModels() {
  monstersLimited.forEach((fileName, i) => {
    gltfLoader.load(`/models/monsters/${fileName}`, (gltf) => {
      gltf.scene.scale.set(0.16, 0.16, 0.16);
      gltf.scene.position.setY(0.08);
      gltf.scene.modelName = fileName.split(".")[0];

      const gameObject = new MemoryGameObject(gltf);

      gameModels.push(gameObject);

      if (gameModels.length === count / 2) {
        return parseModels();
      }
      if (count === gameModels.length) {
        return placeGameObjects();
      }
      // // Animation
    });
  });
}
const basicMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

gltfLoader.load(`/models/boxs/box.gltf`, (gltf) => {
  const [platform, box] = gltf.scene.children;

  // const textureLoader = new THREE.TextureLoader();
  // const matcapTexture = textureLoader.load("./textures/matcap/reflect.png");
  // matcapTexture.colorSpace = THREE.SRGBColorSpace;

  // const basicMaterial = new THREE.MeshMatcapMaterial();
  // basicMaterial.matcap = matcapTexture;

  platform.traverse(function (child) {
    child.material = basicMaterial;
    child.material.needsUpdate = true;
    child.receiveShadow = true;
    child.castShadow = true;
  });
  box.traverse(function (child) {
    child.material = basicMaterial;
    child.material.needsUpdate = true;
    child.castShadow = false;
    child.receiveShadow = true;
  });

  platform.scale.set(0.46, 0.3, 0.46);
  box.scale.set(0.46, 0.5, 0.46);
  platformMesh = platform;
  boxMesh = box;
  if (platformMesh && boxMesh) {
    parseModels();
  }

  // scene.add(...[platform, box]);
});
basicMaterial.transparent = true;

function placeGameObjects() {
  let toPlace = [...gameModels];
  toPlace.sort(() => Math.random() - 0.5); //shuffle the array

  toPlace.forEach((gameModel, i) => {
    const model = gameModel.getScene();

    const x = i % 4;
    const z = Math.ceil((i + 1) / 4);
    model.position.setX(x);
    model.position.setZ(z);

    if (!placedGameModels[x]) {
      placedGameModels[x] = {};
    }

    scene.add(model);
    const newPlatform = platformMesh.clone();

    const platform = new Platform({ x, z, y: 0 }, newPlatform);
    const box = boxMesh.clone();

    box.position.setX(x);
    box.position.setZ(z);
    box.position.setY(0.7);
    const mesh = platform.getMesh();
    box.gameStatus = "idle";
    mesh.material = basicMaterial.clone();
    box.material = basicMaterial.clone();

    placedGameModels[x][z] = { model: gameModel, box, platform };
    boxModels.push(box);

    scene.add(platform.getMesh(), box);
  });
}

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0,
    roughness: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(-5, 5, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Mouse
 */
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

let currentIntersects = [];

window.addEventListener("mousedown", (e) => {
  if (currentIntersects.length > 0) {
    const { x, z } = currentIntersects[0].object.position;

    if (selected.length === 0) {
      selectModel(currentIntersects, placedGameModels[x][z].model);
      return;
    }
    if (
      (selected.length === 2 &&
        selected[0].platform[0].object.gameStatus === "selected") ||
      selected[0].platform[0].object.gameStatus === "lost"
    ) {
      return;
    }
    selectModel(currentIntersects, placedGameModels[x][z].model);
  }
});

function setIdle(mesh) {
  const { x, z } = mesh.position;

  const { platform, box } = placedGameModels[x][z];

  platform.mesh.material.color.set("#AAAAAA");
  box.material.color.set("#AAAAAA");
  box.material.opacity = 1;
}
function setSelected(mesh) {
  const { x, z } = mesh.position;

  const { platform, box } = placedGameModels[x][z];

  box.material.color.set("#fae466");
  box.material.opacity = 0;
}

let winModal = true;
function showWinModal() {
  if (winModal) {
    alert("well done !!!");
    winModal = false;
  }
}

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  raycaster.setFromCamera(mouse, camera);

  const winNumber = boxModels.filter(
    (boxModel) => boxModel.gameStatus === "win"
  ).length;

  if (winNumber >= count) {
    showWinModal();
  }

  currentIntersects = raycaster.intersectObjects(boxModels);

  if (boxModels.length > 0) {
    for (const boxModel of boxModels) {
      if (boxModel.gameStatus === "idle") {
        setIdle(boxModel);
      }

      if (
        boxModel.gameStatus === "selected" ||
        boxModel.gameStatus === "lost" ||
        boxModel.gameStatus === "win"
      ) {
        const { x, z } = boxModel.position;
        setSelected(boxModel);

        const { model } = placedGameModels[x][z];

        const mixer = model.animate();
        mixer.update(deltaTime * 0.4);
      }
    }
  }

  if (
    currentIntersects.length > 0 &&
    currentIntersects[0].object.gameStatus === "idle"
  ) {
    currentIntersects[0].object.material.color.set("#f5d107");
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

import * as THREE from "three";
import * as load from "load-asset";
import { gsap } from "gsap";
import VID_0 from "./assets/xp-0.mp4";
import VID_1 from "./assets/xp-1.mp4";
import DISP_1 from "./assets/disp3.jpeg";
import SNOWGLOBE from "./assets/snowglobe.glb?url";
import BEAR from "./assets/bear.glb?url";
import Scene from "./Scene";
import Transition from "./Transition";

let camera;

let video0, video1;
let text0, text1, disp;
let scene0, scene1;
let transition;
let app;
let doTransition = false,
  transitionDone = false;

export let init = async ({ renderer, scene, width, height }) => {
  app = document.querySelector("#app");

  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  camera.position.z = 720;
  camera.lookAt(new THREE.Vector3());

  disp = new THREE.TextureLoader().load(DISP_1);

  video0 = await load(VID_0);
  video1 = await load(VID_1);
  app.appendChild(video0);
  app.appendChild(video1);
  video0.autoplay = true;
  video0.loop = true;
  video0.muted = true;
  video0.playsinline = true;
  video0.style = "display: none";
  video0.play();
  video1.autoplay = true;
  video1.loop = true;
  video1.muted = true;
  video1.playsinline = true;
  video1.style = "display: none;";
  video1.play();

  text0 = new THREE.VideoTexture(video0);
  text0.needsUpdate = true;
  text1 = new THREE.VideoTexture(video1);
  text1.needsUpdate = true;

  scene0 = new Scene(
    renderer,
    text0,
    SNOWGLOBE,
    width,
    height,
    [0, 0, 640],
    [240, 240, 240],
    [0, 0, 0]
  );
  scene1 = new Scene(
    renderer,
    text1,
    BEAR,
    width,
    height,
    [0, -64, 480],
    [1, 1, 1],
    [0, Math.PI, 0]
  );

  transition = new Transition(renderer, disp, width, height, scene0, scene1);

  const btn = document.createElement("button");
  btn.innerHTML = "Inside Out";
  btn.style = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999`;
  app.appendChild(btn);
  btn.addEventListener("click", () => {
    gsap.to(scene0.camera.position, {
      z: 320,
      duration: 12,
      ease: "power4.out",
      onComplete: () => {
        doTransition = false;
        transitionDone = true;
      },
      onUpdate: () => {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(
          scene0.camera.projectionMatrix,
          scene0.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(matrix);
        if (!frustum.containsPoint(scene0.mesh.position)) {
          doTransition = true;
        }
      },
    });
  });
};

export let update = ({ renderer, scene, time, deltaTime }) => {
  if (doTransition) {
    if (transition) transition.render();
  } else {
    if (transitionDone) {
      if (scene1) {
        scene1.render();
      }
    } else {
      if (scene0) {
        scene0.render();
      }
    }
  }
};

export let resize = ({ width, height }) => {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

export let rendering = "three";

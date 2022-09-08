import * as THREE from "three";
import * as load from "load-asset";
import VID_0 from "./assets/xp-0.mp4";
import VID_1 from "./assets/xp-1.mp4";
import DISP_1 from "./assets/disp3.jpeg";
import Scene from "./Scene";
import Transition from "./Transition";

let camera;

let video0, video1;
let text0, text1, disp;
let scene0, scene1;
let transition;
let app;

export let init = async ({ renderer, scene, width, height }) => {
  app = document.querySelector("#app");

  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  camera.position.z = 1000;
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

  scene0 = new Scene(renderer, text0, width, height);
  scene1 = new Scene(renderer, text1, width, height);

  transition = new Transition(renderer, disp, width, height, scene0, scene1);
};

export let update = ({ renderer, scene, time, deltaTime }) => {
  //   if (scene0) {
  //     scene0.render();
  //   }
  //   if (scene1) {
  //     scene1.render();
  //   }
  if (transition) transition.render();
  //   renderer.render(scene, camera);
};

export let resize = ({ width, height }) => {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

export let rendering = "three";

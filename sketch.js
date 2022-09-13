import * as THREE from "three";
import { gsap } from "gsap";
import DISP_1 from "./assets/disp3.jpeg";
import SNOWGLOBE from "./assets/snowglobe.glb?url";
import LV from "./assets/lv.glb?url";
import Scene from "./Scene";
import Transition from "./Transition";

let camera;

let disp;
let scene0, scene1;
let transition;
let app;
let doTransition = false,
  transitionDone = false;

export let init = async ({ renderer, scene, width, height }) => {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.renderSingleSided = false;
  renderer.shadowMap.renderReverseSided = true;

  app = document.querySelector("#app");

  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  camera.position.z = 720;
  camera.lookAt(new THREE.Vector3());

  disp = new THREE.TextureLoader().load(DISP_1);

  scene0 = new Scene(
    renderer,
    {
      src: SNOWGLOBE,
      position: [0, -4, 640],
      scale: [240, 240, 240],
      rotation: [0, 0, 0],
    },
    width,
    height
  );
  scene1 = new Scene(
    renderer,
    {
      src: LV,
      position: [0, 4, 640],
      scale: [96, 96, 96],
      rotation: [0, 0, 0],
    },
    width,
    height,
    {
      sceneBackground: new THREE.Color(0x735d78),
      plane: new THREE.Color(0xb392ac),
    }
  );

  transition = new Transition(renderer, disp, width, height, scene0, scene1);

  const btn = document.createElement("button");
  btn.innerHTML = "Inside Out";
  btn.style = `position: fixed; top: 0; left: 0; z-index: 9999; padding: 32px; cursor: pointer;`;
  btn.addEventListener("click", () => {
    console.log(scene0.camera);
    gsap
      .timeline({
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
      })
      .to(
        scene0.camera.position,
        {
          y: 64,
          z: 32,
          duration: 32,
          ease: "power4.out",
        },
        "<"
      )
      .play();
  });
  app.appendChild(btn);
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

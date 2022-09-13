import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Scene {
  constructor(
    renderer,
    model,
    width,
    height,
    sceneBackground = new THREE.Color(0x03045e)
  ) {
    this.width = width;
    this.height = height;

    this.init(renderer, sceneBackground);

    this.initLights();

    this.initModel(model);

    this.initDecors();
  }

  init(renderer, sceneBackground) {
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    this.camera.castShadow = true;
    this.camera.position.z = 740;
    this.camera.position.y = 8;

    this.controls = new OrbitControls(
      this.camera,
      document.querySelector("#app")
    );
    this.controls.update();

    this.scene = new THREE.Scene();
    this.scene.background = sceneBackground;

    this.renderTargetParameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    };
    this.fbo = new THREE.WebGLRenderTarget(
      this.width,
      this.height,
      this.renderTargetParameters
    );
  }

  initLights() {
    const light = new THREE.AmbientLight({ color: 0x83c5be, intensity: 0.1 });
    this.scene.add(light);

    const pointLight = new THREE.PointLight(0x83c5be, 4.8, 320);
    pointLight.position.set(64, 120, 640);
    pointLight.castShadow = true;
    this.scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0x023e8a, 0.032);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 32;
    directionalLight.shadow.mapSize.height = 32;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    this.scene.add(directionalLight);
  }

  initModel({ src, position, scale, rotation }) {
    const loader = new GLTFLoader();
    loader.load(src, (gltf) => {
      this.mesh = gltf.scene;
      this.scene.add(this.mesh);

      this.mesh.position.set(...position);
      this.mesh.scale.set(...scale);
      this.mesh.rotation.set(...rotation);

      this.mesh.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    });
  }

  initDecors() {
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      new THREE.MeshStandardMaterial({ color: 0x023e8a })
    );
    this.ground.rotation.x = -Math.PI * 0.48;
    this.ground.position.set(0, -16, 640);
    this.ground.scale.set(320, 120, 320);
    this.ground.receiveShadow = true;
    this.ground.castShadow = true;
    this.scene.add(this.ground);
  }

  render(rtt) {
    if (this.controls) this.controls.update();
    // if (this.mesh) this.mesh.rotation.y -= 0.012;
    if (rtt) {
      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();

      this.renderer.render(this.scene, this.camera);
    } else this.renderer.render(this.scene, this.camera);
  }
}

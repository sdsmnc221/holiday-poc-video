import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Scene {
  constructor(
    renderer,
    model,
    width,
    height,
    colors = {
      sceneBackground: new THREE.Color(0x03045e),
      plane: new THREE.Color(0x023e8a),
    }
  ) {
    this.width = width;
    this.height = height;
    this.colors = colors;

    this.init(renderer);

    this.initLights();

    this.initModel(model);

    this.initDecors();
  }

  init(renderer) {
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    this.camera.position.z = 740;
    this.camera.position.y = 8;
    this.camera.lookAt(new THREE.Vector3());
    this.camera.receiveShadow = true;
    this.camera.castShadow = true;

    this.controls = new OrbitControls(
      this.camera,
      document.querySelector("#app")
    );
    this.controls.update();

    this.scene = new THREE.Scene();
    this.scene.background = this.colors.sceneBackground;

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
    const ambientLight = new THREE.AmbientLight({
      color: 0x83c5be,
      intensity: 0.1,
    });
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x83c5be, 1.6, 640);
    pointLight.position.set(64, 120, 640);
    pointLight.castShadow = true;
    pointLight.shadow.bias = -0.0032;
    pointLight.shadow.radius = 16;
    pointLight.shadow.mapSize.set(512, 512);
    this.scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    directionalLight.position.set(64, 120, 640);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.radius = 3.2;
    directionalLight.shadow.mapSize.set(512, 512);
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
      new THREE.MeshStandardMaterial({ color: this.colors.plane })
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
    if (this.mesh) this.mesh.rotation.y -= 0.012;
    if (rtt) {
      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();

      this.renderer.render(this.scene, this.camera);
    } else this.renderer.render(this.scene, this.camera);
  }
}

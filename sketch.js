import * as THREE from "three";
import * as load from "load-asset";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min";
import VID_0 from "./assets/xp-0.mp4";
import VID_1 from "./assets/xp-1.mp4";

let camera;

let video0, video1;
let text0, text1;
let mesh0, mesh1;

const vertexShader = `
    uniform float uProgress;
    uniform vec2 uMeshScale;
    uniform vec2 uMeshPosition;
    uniform vec2 uViewSize;

    varying vec2 vUv;

    void main(){
        vec3 pos = position.xyz;

        float maxDistance = distance(vec2(0.),vec2(0.5));
        float dist = distance(vec2(0.), uv-0.5);
        float activation = smoothstep(0.,maxDistance,dist);
		
        float latestStart = 0.032;
        float startAt = activation * latestStart;
        float vertexProgress = smoothstep(startAt,1.,uProgress);
     
      // Scale to page view size/page size

      vec2 scaleToViewSize = uViewSize / uMeshScale - 1.;
      vec2 scale = vec2(
        1. + scaleToViewSize * vertexProgress
      );
      pos.xy *= scale;
      
      // Move towards center 
      pos.y += -uMeshPosition.y * vertexProgress;
      pos.x += -uMeshPosition.x * vertexProgress;
      
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
        vUv = uv;
    }
`;

const fragmentShader = `
    uniform vec2 uvOffset;
    uniform sampler2D uTexture;

    varying vec2 vUv;

    void main()
    {
        gl_FragColor = texture2D(uTexture, vUv + uvOffset); 
    }
`;

class GridToFullscreenEffect {
  constructor(width, height, scene, camera, text) {
    this.width = width;
    this.height = height;
    this.text = text;
    this.camera = camera;
    this.scene = scene;

    this.uniforms = {
      uProgress: new THREE.Uniform(0),
      uMeshScale: new THREE.Uniform(new THREE.Vector2(0, 0)),
      uMeshPosition: new THREE.Uniform(new THREE.Vector2(0, 0)),
      uViewSize: new THREE.Uniform(new THREE.Vector2(1, 1)),
      uTexture: { type: "t", value: this.text },
      uvOffset: { type: "v", value: new THREE.Vector2(0, 0) },
    };

    const viewSize = this.getViewSize();
    this.uniforms.uViewSize.value.x = viewSize.width;
    this.uniforms.uViewSize.value.y = viewSize.height;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(1, 1, segments, segments);
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );

    return { width: height * this.camera.aspect, height };
  }

  getRectSize() {
    return {
      width: 0.1,
      height: 0.1,
      left: this.width / 2 - 0.1 / 2,
      top: this.height / 2 - 0.1 / 2,
    };
  }

  onGridImageClick() {
    // getBoundingClientRect gives pixel units relative to the top left of the pge
    const rect = this.getRectSize();
    const viewSize = this.getViewSize();

    // 1. Transform pixel units to camera's view units
    const widthViewUnit = (rect.width * viewSize.width) / this.width;
    const heightViewUnit = (rect.height * viewSize.height) / this.height;
    let xViewUnit = (rect.left * viewSize.width) / this.width;
    let yViewUnit = (rect.top * viewSize.height) / this.height;

    // 2. Make units relative to center instead of the top left.
    xViewUnit = xViewUnit - viewSize.width / 2;
    yViewUnit = yViewUnit - viewSize.height / 2;

    // 3. Make the origin of the plane's position to be the center instead of top Left.
    let x = xViewUnit + widthViewUnit / 2;
    let y = -yViewUnit - heightViewUnit / 2;

    // 4. Scale and position mesh
    const mesh = this.mesh;
    // Since the geometry's size is 1. The scale is equivalent to the size.
    mesh.scale.x = widthViewUnit;
    mesh.scale.y = heightViewUnit;
    mesh.position.x = x;
    mesh.position.y = y;

    this.uniforms.uMeshPosition.value.x = x / widthViewUnit;
    this.uniforms.uMeshPosition.value.y = y / heightViewUnit;
    this.uniforms.uMeshScale.value.x = widthViewUnit;
    this.uniforms.uMeshScale.value.y = heightViewUnit;

    new TWEEN.Tween(this.uniforms.uProgress)
      .to({ value: 1 }, 3200)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();

    // setTimeout(
    //   () =>
    //     new TWEEN.Tween(this.uniforms.uProgress)
    //       .to({ value: 0 }, 3200)
    //       .easing(TWEEN.Easing.Sinusoidal.InOut)
    //       .start(),
    //   6400
    // );
  }
}

export let init = async ({ scene, width, height }) => {
  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.z = 16;
  camera.lookAt(new THREE.Vector3());

  video0 = await load(VID_0);
  video1 = await load(VID_1);

  text0 = new THREE.VideoTexture(video0);
  text0.needsUpdate = true;
  mesh0 = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: text0 })
  );
  mesh0.scale.set(0.02, 0.02, 0.1);
  scene.add(mesh0);

  text1 = new THREE.VideoTexture(video1);
  text1.needsUpdate = true;
  mesh1 = new GridToFullscreenEffect(width, height, scene, camera, text1);

  const app = document.querySelector("#app");
  const btn = document.createElement("button");
  btn.innerHTML = "Inside Out";
  btn.style = `position: absolute; top: ${width / 2.4}px; left: ${
    height / 2.4
  }px; z-index: 999`;
  btn.addEventListener("click", () => {
    mesh1.onGridImageClick();
  });
  app.appendChild(btn);

  window.addEventListener("click", () => {
    video0.play();
    video1.play();
  });
};

export let update = ({ renderer, scene, time, deltaTime }) => {
  TWEEN.update();
  renderer.render(scene, camera);
};

export let resize = ({ width, height }) => {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

export let rendering = "three";

import * as THREE from "three";
import * as load from "load-asset";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min";
import VID_0 from "./assets/xp-0.mp4";
import VID_1 from "./assets/xp-1.mp4";
import DISP_1 from "./assets/disp1.jpeg";

let camera;

let video0, video1;
let text0, text1, textures;
let mesh0, mesh1;
let current = 0;

const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const fragmentShader = `
    uniform float time;
    uniform float progress;
    uniform float width;
    uniform float scaleX;
    uniform float scaleY;
    uniform float transition;
    uniform float radius;
    uniform float swipe;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform sampler2D displacement;
    uniform vec4 resolution;
    varying vec2 vUv;
    varying vec4 vPosition;

    float parabola( float x, float k ) {
        return pow( 4. * x * ( 1. - x ), k );
    }
    
    void main()	{
        vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
        vec2 p = newUV;
        vec2 start = vec2(0.5,0.5);
        vec2 aspect = resolution.wz;
        // vec2 uv = newUV;
        vec2 uv = vUv;
        float dt = parabola(progress, 1.);
        vec4 noise = texture2D(displacement, fract(vUv+time*0.04));
        float prog = progress*0.66 + noise.g * 0.04;
        float circ = 1. - smoothstep(-width, 0.0, radius * distance(start*aspect, uv*aspect) - prog*(1.+width));
        float intpl = pow(abs(circ), 1.);
        vec4 t1 = texture2D( texture1, (uv - 0.5) * (1.0 - intpl) + 0.5 ) ;
        vec4 t2 = texture2D( texture2, (uv - 0.5) * intpl + 0.5 );
        gl_FragColor = mix( t1, t2, intpl );
        // gl_FragColor = texture2D(texture1, vec2(vUv));
    }
`;

export let init = async ({ scene, width, height }) => {
  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  camera.position.z = 1000;
  camera.lookAt(new THREE.Vector3());

  video0 = await load(VID_0);
  video1 = await load(VID_1);

  text0 = new THREE.VideoTexture(video0);
  text0.needsUpdate = true;
  text1 = new THREE.VideoTexture(video1);
  text1.needsUpdate = true;
  textures = [text0, text1];

  //   text0 = new THREE.TextureLoader().load(IMG_0);
  //   text0.needsUpdate = true;
  //   text1 = new THREE.TextureLoader().load(IMG_1);
  //   text1.needsUpdate = true;
  //   textures = [text0, text1];

  //   mesh0 = new THREE.Mesh(
  //     new THREE.PlaneGeometry(width, height),
  //     new THREE.MeshBasicMaterial({ map: text0 })
  //   );
  //   scene.add(mesh0);

  const uniforms = {
    time: { type: "f", value: 0 },
    progress: { type: "f", value: 0 },
    border: { type: "f", value: 0 },
    intensity: { type: "f", value: 0 },
    scaleX: { type: "f", value: 0 },
    scaleY: { type: "f", value: 40 },
    transition: { type: "f", value: 40 },
    swipe: { type: "f", value: 0 },
    texture1: { type: "f", value: text0 },
    texture2: { type: "f", value: text1 },
    displacement: {
      type: "f",
      value: new THREE.TextureLoader().load(DISP_1),
    },
    resolution: { type: "v4", value: new THREE.Vector4() },
    radius: { value: 0.2, type: "f", min: 0.1, max: 2 },
    width: { value: 0.5, type: "f", min: 0, max: 1 },
  };

  mesh1 = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })
  );
  scene.add(mesh1);

  const app = document.querySelector("#app");
  const btn = document.createElement("button");
  btn.innerHTML = "Inside Out";
  btn.style = `position: absolute; top: ${width / 2.4}px; left: ${
    height / 2.4
  }px; z-index: 999`;
  btn.addEventListener("click", () => {
    let len = textures.length;
    let nextTexture = textures[(current + 1) % len];
    mesh1.material.uniforms.texture2.value = nextTexture;

    new TWEEN.Tween(mesh1.material.uniforms.progress)
      .to({ value: 1 }, 3200)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        current = (current + 1) % len;
        mesh1.material.uniforms.texture1.value = nextTexture;
        mesh1.material.uniforms.progress.value = 0;
      })
      .start();
  });
  app.appendChild(btn);

  window.addEventListener("click", () => {
    video0.play();
    video1.play();
  });
};

export let update = ({ renderer, scene, time, deltaTime }) => {
  TWEEN.update();
  if (mesh1) mesh1.material.uniforms.time.value = time;
  renderer.render(scene, camera);
};

export let resize = ({ width, height }) => {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

export let rendering = "three";

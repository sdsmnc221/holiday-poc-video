import * as THREE from "three";

const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const fragmentShader = `
    uniform sampler2D text;
    uniform float uViewportAspect;
    uniform float uTextAspect;

    varying vec2 vUv;

    void main()	{
        vec2 multiplier = vec2(1.);

        if (uTextAspect > uViewportAspect) {
            multiplier = vec2(uViewportAspect / uTextAspect, 1.);
        }

        vec2 newUv = (vUv - vec2(0.5)) * multiplier + vec2(0.5);

        vec4 video = texture2D(text, newUv);

        gl_FragColor = video;
    }
`;

export default class Scene {
  constructor(renderer, texture, width, height) {
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    this.camera.position.z = 1000;
    this.camera.lookAt(new THREE.Vector3());

    this.scene = new THREE.Scene();

    this.texture = texture;

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          uViewportAspect: new THREE.Uniform(width / height),
          uTextAspect: new THREE.Uniform(
            this.texture.source.data.videoWidth /
              this.texture.source.data.videoHeight
          ),
          text: { type: "f", value: this.texture },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      })
    );
    this.scene.add(this.mesh);

    this.renderTargetParameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: false,
    };
    this.fbo = new THREE.WebGLRenderTarget(
      width,
      height,
      this.renderTargetParameters
    );
  }

  render(rtt) {
    if (rtt) {
      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();

      this.renderer.render(this.scene, this.camera);
    } else this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min";

const transitionParams = {
  transition: 0,
  animateTransition: true,
  textureThreshold: 3.2,
};

const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const fragmentShader = `
    uniform float mixRatio;

    uniform sampler2D tDiffuse1;
    uniform sampler2D tDiffuse2;
    uniform sampler2D tMixTexture;

    uniform int useTexture;
    uniform float threshold;

    varying vec2 vUv;

    void main() {
        vec4 texel1 = texture2D( tDiffuse1, vUv );
        vec4 texel2 = texture2D( tDiffuse2, vUv );

        if (useTexture == 1) {
            vec4 transitionTexel = texture2D( tMixTexture, vUv );
            float r = mixRatio * (1.0 + threshold * 2.0) - threshold;
            float mixf = clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);
    
            gl_FragColor = mix( texel1, texel2, mixf );
        } else {
            gl_FragColor = mix( texel2, texel1, mixRatio ); 
        }
    }
`;

export default class Transition {
  constructor(renderer, texture, width, height, sceneA, sceneB) {
    this.renderer = renderer;

    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      -10,
      10
    );

    this.scene = new THREE.Scene();

    this.texture = texture;

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          tDiffuse1: {
            type: "t",
            value: sceneA.fbo.texture,
          },
          tDiffuse2: {
            type: "t",
            value: sceneB.fbo.texture,
          },
          mixRatio: {
            type: "f",
            value: 0.0,
          },
          threshold: {
            type: "f",
            value: 0.1,
          },
          useTexture: {
            type: "i",
            value: 1,
          },
          tMixTexture: {
            type: "t",
            value: this.texture,
          },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      })
    );
    this.scene.add(this.mesh);

    // Link both scenes and their FBOs
    this.sceneA = sceneA;
    this.sceneB = sceneB;

    this.mesh.material.uniforms.tDiffuse1.value = sceneA.fbo.texture;
    this.mesh.material.uniforms.tDiffuse2.value = sceneB.fbo.texture;

    new TWEEN.Tween(transitionParams)
      .to({ transition: 1 }, 3200)
      .repeat(Infinity)
      .yoyo(true)
      .start();

    this.needChange = false;
  }

  setTextureThreshold(value) {
    this.mesh.material.uniforms.threshold.value = value;
  }

  useTexture(value) {
    this.mesh.material.uniforms.useTexture.value = value ? 1 : 0;
  }

  setTexture() {
    this.mesh.material.uniforms.tMixTexture.value = this.texture;
  }

  render() {
    // // Transition animation
    if (transitionParams.animateTransition) {
      TWEEN.update();

      // Change the current alpha texture after each transition
      if (
        transitionParams.transition == 0 ||
        transitionParams.transition == 1
      ) {
        if (this.needChange) {
          this.mesh.material.uniforms.tMixTexture.value = this.texture;
          this.needChange = false;
        }
      } else this.needChange = true;
    }

    this.mesh.material.uniforms.mixRatio.value = transitionParams.transition;

    // Prevent render both scenes when it's not necessary
    if (transitionParams.transition == 0) {
      this.sceneB.render(false);
    } else if (transitionParams.transition == 1) {
      this.sceneA.render(false);
    } else {
      // When 0<transition<1 render transition between two scenes
      this.sceneA.render(true);
      this.sceneB.render(true);

      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }
}

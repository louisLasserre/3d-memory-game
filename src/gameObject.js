import { AnimationMixer } from "three";

export class MemoryGameObject {
  constructor(gltf, coordinates = null) {
    this.scene = gltf.scene;
    this.gltf = gltf;
    this.isAnimating = false;
    if (coordinates !== null) {
      this.coordinates = coordinates;
    }
  }

  getCoordinates() {
    return this.coordinates;
  }
  getGltf() {
    return this.gltf;
  }
  getScene() {
    return this.scene;
  }

  animate() {
    if (this.isAnimating) {
      return this.mixer;
    }
    this.mixer = new AnimationMixer(this.scene);
    const action = this.mixer.clipAction(this.gltf.animations[2]);
    action.play();

    this.isAnimating = true;
    return this.mixer;
  }
}

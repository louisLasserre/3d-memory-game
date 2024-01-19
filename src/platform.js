import * as THREE from "three";

export class Platform {
  constructor(coordinates = undefined, mesh) {
    this.status = "idle";
    this.mesh = mesh;
    if (coordinates) {
      this.mesh.position.set(coordinates.x, coordinates.y, coordinates.z);
    }
    this.mesh.receiveShadow = true;
  }

  getMesh() {
    return this.mesh;
  }
}

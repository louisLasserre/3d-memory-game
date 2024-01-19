class GameModel {
  constructor(placedModels) {
    this.placedModels = this.placedModels;
    this.selected = [];
  }

  hoverCase(boxMesh) {
    boxMesh.material.color.set("#f5d107");
  }

  selectCase(clickedMesh) {
    const { x, z } = clickedMesh;

    const { platform, box } = this.placedModels[x][z];

    this.selected.push(box);
    //box.material.opacity = 0;
  }
  unSelectAll() {
    this.selected = [];
  }

  win(boxMesh) {
    const { x, z } = clickedMesh;

    const { platform, box } = this.placedModels[x][z];

    platform.mesh.material.color.set("#00FF00");
    box.gameStatus = "win";
  }
}

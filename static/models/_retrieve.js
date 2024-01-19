import { readdirSync, writeFile } from "node:fs";

const objectsTypes = ["monsters"];

objectsTypes.forEach((objectType) => {
  const folderPath = `./${objectType}`;

  const files = readdirSync(folderPath).map((fileName) => {
    if (fileName[0] !== ".") {
      return fileName;
    }
  });

  writeFile(`../data/${objectType}.json`, JSON.stringify(files), () => {});
});

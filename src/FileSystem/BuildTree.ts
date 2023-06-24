import { WebResourceMeta } from "../types";

// Function to build the tree structure
export function buildTree(fileList: WebResourceMeta[]) {
  const tree: { [key: string]: WebResourceMeta | any } = {};

  fileList.forEach((file) => {
    const pathParts = file.name.split("/").filter((part) => part !== ""); // Split the path and remove empty parts

    let currentNode = tree;
    pathParts.forEach((part) => {
      if (!currentNode[part]) {
        currentNode[part] = {};
      }
      currentNode = currentNode[part];
    });

    Object.assign(currentNode, file); // Assign the original object as the leaf node
  });

  return tree;
}

export function findItemInTree(filename: string, tree: any) {
  let item = tree;
  if (filename !== "") {
    const parts = filename.split("/");

    while (parts.length) {
      const subfolder = parts.shift() || "";
      if (item[subfolder]) {
        item = item[subfolder];
      } else {
        item = null;
        break;
      }
    }
  }
  return item;
}

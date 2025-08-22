export const getResource = (local: string) => {
  // TODO package these three in an Asset interface (to make procedural / tinting later easy)
  return chrome.runtime.getURL(local);
};
export const getMenuIcon = (local: string) => {
  return chrome.runtime.getURL(`assets/menu-icons/${local}`);
};
export const getModuleAsset = (local: string) => {
  return chrome.runtime.getURL(`assets/module-assets/${local}`);
};

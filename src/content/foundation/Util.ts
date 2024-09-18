// declare global {
//     interface Element {
//         setAttributes(attrs: [string, string][]): this
//         attachTo(parent: HTMLElement): this
//     }
// }
// HTMLElement.prototype.setAttributes = function(attrs: [string, string][]): typeof this { 
//     for (const [attr, value] of attrs) { 
//         this.setAttribute(attr, value); break;
//     }
//     return this
// }
// HTMLElement.prototype.attachTo = function(parent: HTMLElement): typeof this { 
//     parent.appendChild(this)
//     return this
// }
const setAttributes = function(node: Element, attrs: { [attr:string]:string }): typeof node { 
    for (const [attr, value] of Object.entries(attrs)) { 
        node.setAttribute(attr, value);
    }
    return node
}
const setParent = function(node: Element, parent: HTMLElement): typeof node { 
    parent.appendChild(node)
    return node
}

const clamp = (min: number, n: number, max: number) => Math.min(Math.max(min, n), max)
function preventDefaults (e: Event) { e.preventDefault(); e.stopPropagation() }

const getResource = (local: string) => {  // TODO package these three in an Asset interface (to make procedural / tinting later easy)
    return chrome.runtime.getURL(local)
}
const getMenuIcon = (local: string) => {
    return chrome.runtime.getURL(`assets/menu-icons/${local}`)
}
const getModuleAsset = (local: string) => {
    return chrome.runtime.getURL(`assets/module-assets/${local}`)
}

export { clamp, preventDefaults, getResource, getMenuIcon, getModuleAsset, setAttributes, setParent }
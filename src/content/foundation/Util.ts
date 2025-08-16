export const setAttributes = function(node: Element, attrs: { [attr:string]:string }): typeof node { 
    for (const [attr, value] of Object.entries(attrs)) { 
        node.setAttribute(attr, value);
    }
    return node
}
export const setParent = function(node: Element, parent: HTMLElement): typeof node { 
    parent.appendChild(node)
    return node
}

export const clamp = (min: number, n: number, max: number) => Math.min(Math.max(min, n), max)
export function preventDefaults (e: Event) { e.preventDefault(); e.stopPropagation() }

export const getResource = (local: string) => {  // TODO package these three in an Asset interface (to make procedural / tinting later easy)
    return chrome.runtime.getURL(local)
}
export const getMenuIcon = (local: string) => {
    return chrome.runtime.getURL(`assets/menu-icons/${local}`)
}
export const getModuleAsset = (local: string) => {
    return chrome.runtime.getURL(`assets/module-assets/${local}`)
}

export type ElementDefinition = {
    type: string,
    class?: string,
    style?: string,
    textContent?: string,
    reference?: string,
    properties?: { [key: string]: string },
    eventListeners?: { [key: string]: EventListener },

    children?: Iterable<ElementDefinition | HTMLElement>
}

export function constructElement(
    def: ElementDefinition, referenceRecord?: Record<string, HTMLElement>
): HTMLElement {
    const elem = document.createElement(def.type)
    if (def.class) { elem.className = def.class }
    if (def.style) { elem.style.cssText = def.style }
    if (def.textContent) { elem.textContent = def.textContent }
    if (def.reference && referenceRecord) { referenceRecord[def.reference] = elem }
    if (def.properties) {
        for (const [k, v] of Object.entries(def.properties)) {
            if (k in elem) { (elem as Record<string, any>)[k] = v }
        }
    }
    if (def.eventListeners) {
        for (const [k,v] of Object.entries(def.eventListeners)) {
            elem.addEventListener(k, v)
        }
    }
    if (def.children) {
        for (const childDef of def.children) {
            const child = childDef instanceof HTMLElement ? childDef : constructElement(childDef, referenceRecord)
            elem.appendChild(child)
        }
    }

    return elem
}


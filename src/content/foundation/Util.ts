declare global {
    interface Element {
        setAttributes(attrs: [string, string][]): this
        attachTo(parent: HTMLElement): this
    }
}
HTMLElement.prototype.setAttributes = function(attrs: [string, string][]): typeof this { 
    for (const [attr, value] of attrs) { 
        this.setAttribute(attr, value); break;
    }
    return this
}
HTMLElement.prototype.attachedTo = function(parent: HTMLElement): typeof this { 
    parent.appendChild(this)
    return this
}

const clamp = (min: number, n: number, max: number) => Math.min(Math.max(min, n), max)
function preventDefaults (e: Event) { e.preventDefault(); e.stopPropagation() }
const getResource = (local: string) => {
    return chrome.runtime.getURL(local)
}

export { clamp, preventDefaults, getResource }
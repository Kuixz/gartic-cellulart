

const clamp = (min, n, max) => Math.min(Math.max(min, n), max)

function preventDefaults (e) { e.preventDefault(); e.stopPropagation() }

const setAttributes = (node, attrs) => { 
    for (const [attr, value] of Object.entries(attrs)) { 
        switch (attr) {
            case "parent": value.appendChild(node);  break;
            default: node.setAttribute(attr, value); break;
        }
    }
    return node 
}

const getResource = (local) => {
    try {
        return chrome.runtime.getURL(local)
    } catch {
        console.log(`Could not find resource ${local}`)
        return ''
    }
}

// Constants
const svgNS = "http://www.w3.org/2000/svg"
const configChildTrunk = { childList: true };

export { clamp, preventDefaults, setAttributes, getResource, svgNS, configChildTrunk }
 /* ----------------------------------------------------------------------
  *                              Foundation 
  *           With credit to Janith (https://codepen.io/jaksun)
  * ---------------------------------------------------------------------- */ 

// Libraries
var gifenc;
(async () => {
    const src = chrome.runtime.getURL("src/lib/gifenc.esm.mjs");
    gifenc = await import(src);
})(); // setTimeout(function(){console.log(gifenc); console.log(gifenc.GIFEncoder); console.log(gifenc.quantize)}, 1000)
const WIW = {
    wiwNode: undefined, // HTMLDivElement
    currentZIndex: 20,  // todo reset z index when a threshold is passed

    constructWIWNode(customNode) {
        if (customNode) { WIW.wiwNode = customNode; return }
        WIW.wiwNode = setAttributes(document.createElement("div"), { style: "visibility: hidden", class: "window-in-window" })
        WIW.wiwNode.innerHTML = `
            <div class = "wiw-header">≡<div class = "wiw-close"></div></div>
            <div class = "wiw-body"></div>`
    },
    newWIW(closeable, visible, ratio) {
        const newWIW = WIW.wiwNode.cloneNode(true)
        const v = visible ? "visible" : "hidden"
        const r = ratio ? ratio : (100/178)
        closeable
            ? newWIW.querySelector(".wiw-close").onmousedown = function() { newWIW.remove() }
            : newWIW.querySelector(".wiw-close").remove()
        WIW.initDragElement(newWIW)
        WIW.initResizeElement(newWIW, r)
        return setAttributes(newWIW, { 
            style: "visibility:" + v + "; min-height:" + (178 * r + 40) + "px; height:" + (178 * r + 40) + "px; max-height:" + (536 * r + 40) + "px", 
            parent: document.body 
        })
    },
    // The below code is taken from Janith at https://codepen.io/jkasun/pen/QrLjXP
    // and is used to make the various window-in-windows movable.
    initDragElement(element) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        var elmnt = null;
        var header = getHeader(element);
        
        element.onmousedown = function() {
            this.style.zIndex = String(++WIW.currentZIndex);
        }
        if (header) {
            header.parentWindow = element;
            header.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            elmnt = this.parentWindow;

            e = e || window.event;
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!elmnt) {
                return;
            }

            e = e || window.event;
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = elmnt.offsetTop - pos2 + "px";
            elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }

        function getHeader(element) {
            return element.querySelector(".wiw-header");
        }
    },
    initResizeElement(element, ratio) {
        var elmnt = null;
        var startX, startY, startWidth, startHeight;
        
        var both = document.createElement("div");
        both.classList.add("resizer-both");
        element.appendChild(both);

        both.addEventListener("mousedown", initDrag, false);
        both.parentWindow = element;

        function initDrag(e) {
            elmnt = this.parentWindow;

            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(
                document.defaultView.getComputedStyle(elmnt).width,
                10
            );
            startHeight = parseInt(
                document.defaultView.getComputedStyle(elmnt).height,
                10
            );
            document.documentElement.addEventListener("mousemove", doDrag, false);
            document.documentElement.addEventListener("mouseup", stopDrag, false);
        }

        function doDrag(e) {
            var dist = Math.max(e.clientX - startX, (e.clientY - startY) / ratio)
            elmnt.style.width = startWidth + dist + "px";
            elmnt.style.height = startHeight + ratio * dist + "px";
        }

        function stopDrag() {
            document.documentElement.removeEventListener("mousemove", doDrag, false);
            document.documentElement.removeEventListener("mouseup", stopDrag, false);
        }
    }
}

// Submodule functionalities
// const Console = { // No filtering functionality
//     name: "Console",
    
//     log: function(message, optMod) {
//         const mod = optMod || { name:'?' }
//         const msg = `[${mod.name || '?'}] ${message}`
//         this.onprint(msg, mod)
//         // console.log(msg)
//     },
//     alert: function(message, optMod) {
//         const mod = optMod || { name:'?' }
//         const msg = `[${mod.name || '?'}] ERROR: ${message}`
//         this.onprint(msg, mod)
//         console.log(msg)
//     },
//     onprint: function(message) {} // Dynamically set
// }
/* */
const Console = { // Only block certain messages
    name: "Console",
    disabled: new Set(), //(["Console"]),

    toggle: function(mod) {
        this.set(mod, !this.disabled.has(mod))
    },
    set: function(mod, disabled) {
        disabled ? this.disabled.add(mod) : this.disabled.delete(mod)
        Console.log('Console', (disabled ? "Disabled " : "Enabled ") + "logging for " + mod.name)
    },
    log: function(mod, message) {
        if (this.disabled.has(mod)) { return }
        const msg = `[${mod.name}] ${message}`
        this.onprint(msg)
        // console.log(msg)
    },
    alert: function(mod, message) {
        const msg = `[${mod.name}] ERROR: ${message}`
        this.onprint(msg)
        console.log(msg)
    },
    onprint: function(message) {} // Dynamically set
}
/* */
// const Console = { // Only print certain messages
//     name: "Console",
//     enabled: new Set(["Console"]),

//     toggle: function(mod) {
//         this.set(mod, !this.enabled.has(mod))
//     },
//     set: function(mod, enabled) {
//         enabled ? this.enabled.add(mod) : this.enabled.delete(mod)
//         Console.log('Console', (enabled ? "Enabled " : "Disabled ") + "logging for " + mod.name)
//     },
//     log: function(mod, message) {
//         if (!this.enabled.has(mod)) { return }
//         const msg = `[${mod.name}] ${message}`
//         this.onprint(msg)
//         // console.log(msg)
//     },
//     alert: function(mod, message) {
//         const msg = `[${mod.name}] ERROR: ${message}`
//         this.onprint(msg)
//         // console.log(msg)
//     },
//     onprint: function(message) {} // Dynamically set
// }
const Shelf = {
    // init() {
    //     ;["session", "local"].forEach((zone) => {
    //         Box[zone] = { }
    //         ;["set, get"].forEach((func) => {
    //             Box[zone][func] = async function(items) { chrome.storage[zone][func](items) }
    //         })
    //     })
    // },

    async set(items) { // Dictionary<String, any>
        return await chrome.storage.local.set(items)
    },
    async get(items) { // [String]
        return await chrome.storage.local.get(items)
    },
    async remove(items) { // [String]
        return await chrome.storage.local.remove(items)
    },
    async clear() {
        chrome.storage.local.clear()
    },
    async retrieveOrElse(key, defaultValue, write = false) {
        const data = await chrome.storage.local.get(key)
        if (data[key] !== undefined) { return data[key] }
        if (write) { chrome.storage.local.set({ [key]:defaultValue }) }
        return defaultValue
    }
}
const Keybinder = {
    keybinds: undefined,   // [Keybind]
    init() {
        document.addEventListener("keydown", (e) => {  // console.log(e.code)
            Keybinder.keybinds.forEach((bind) => bind.triggeredBy(e) && bind.response(e))
        })
        this.reset()
    },
    reset() {
        Keybinder.keybinds = []
    },
    set(keybinds) {
        Keybinder.keybinds = keybinds
    },
    add(keybinds) {
        Keybinder.keybinds = Keybinder.keybinds.concat(keybinds)
    }
}
const SHAuth = {
    using(storage) {
        SHAuth.storage = storage
        return SHAuth
    },

    hash: "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb",
    validated: false, //false,
    storage: null,  

    remember(str) {
        _ = SHAuth.storage.set({"auth":str})
    },
    validate(str) {
        const correct = str === SHAuth.hash
        SHAuth.validated = correct
        return correct
    },
    async tryLogin() {
        const r = await SHAuth.storage.get("auth")
        // console.log(r)
        return SHAuth.validate(r.auth)
    },
    async authenticate (message) {
        if (SHAuth.validated) { return true }
        const msgBuffer = new TextEncoder().encode(message)
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
        const hashString = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
        SHAuth.remember(hashString)
        // alert(hashString)
        return SHAuth.validate(hashString)
    }
}
const Socket = {
    name: 'Socket',
    handlers: [],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'messageFromSocket') { return; }
            const func = event.data.function
            const data = event.data.data
            Console.log(`incoming (${func}, ${data})`, Socket)
            Socket.handlers.forEach(handler => { 
                if (handler.filter == func) { handler.handle(data) }
            })
        })
    },
    post(func, data) {
        Console.log(`outgoing (${func}, ${data})`, Socket)
        
        window.postMessage({
            direction: "messageToSocket",
            function: func,
            data: data
        }, 'https://garticphone.com')
    },
    addMessageListener(func, handler) {
        Socket.handlers.push({ filter:func, handle:handler });
    }
}

// Utility functions
const clamp = (min, n, max) => Math.min(Math.max(min, n), max)
function preventDefaults (e) { e.preventDefault(); e.stopPropagation() }
const setAttributes = (node, attrs) => { 
    for (const [attr, value] of Object.entries(attrs)) { 
        switch (attr) {
            case "parent": value.appendChild(node);  break;
            default: node.setAttribute(attr, value); break;
        }
    }; 
    return node 
}

// Constants
const svgNS = "http://www.w3.org/2000/svg"
const configChildTrunk = { childList: true };
// const echo = (v) => v
// const const0 = () => 0
const modeParameters = 
// {
//     1:  { write: 40,  draw: 150, firstMultiplier: 1.25, fallback: 2,  turns: echo,       decay: const0 },
//     8:  { write: 90,  draw: 300, firstMultiplier: 1   , fallback: 1,  turns: echo,       decay: (turns) => Math.exp(8 / turns) },
//     3:  { write: 20,  draw: 75,  firstMultiplier: 1.25, fallback: 2,  turns: echo,       decay: const0 },
//     11: { write: 40,  draw: 150, firstMultiplier: 1   , fallback: 1,  turns: echo,       decay: const0 },
//     9:  { write: 40,  draw: 150, firstMultiplier: 1.25, fallback: -1, turns: (v) => v+1, decay: const0 },
//     5:  { write: 40,  draw: 150, firstMultiplier: 0.2 , fallback: -1, turns: echo,       decay: const0 },
//     20: { write: 2,   draw: 2,   firstMultiplier: 1   , fallback: 1,  turns: echo,       decay: const0 },
//     17: { write: 40,  draw: 2,   firstMultiplier: 1.25, fallback: 1,  turns: () => 1,    decay: const0 },
//     21: { write: 2 ,  draw: 150, firstMultiplier: 1   , fallback: 1,  turns: echo,       decay: const0 },
//     18: { write: 20,  draw: 75,  firstMultiplier: 1.25, fallback: 1,  turns: echo,       decay: const0 },
//     10: { write: 40,  draw: 150, firstMultiplier: 1.25, fallback: 2,  turns: echo,       decay: const0 },
//     5:  { write: 40,  draw: 150, firstMultiplier: 1.25, fallback: 1,  turns: echo,       decay: const0 },
//     7:  { write: 20,  draw: 75,  firstMultiplier: 1.25, fallback: 2,  turns: echo,       decay: const0 },
//     14: { write: 40,  draw: 150, firstMultiplier: 2   , fallback: 1,  turns: echo,       decay: const0 },
//     13: { write: 2,   draw: 2,   firstMultiplier: 1   , fallback: 1,  turns: echo,       decay: const0 },
// }
{
    "NORMAL":        { write: 40,  draw: 150, decay: 0, firstMultiplier: 1.25, fallback: 2  }, // 1
    "KNOCK-OFF":     { write: 90,  draw: 300,           firstMultiplier: 1   , fallback: 1  }, // 2
    "SECRET":        { write: 20,  draw: 75,  decay: 0, firstMultiplier: 1.25, fallback: 2  }, // 3
    "ANIMATION":     { write: 40,  draw: 150, decay: 0, firstMultiplier: 1   , fallback: 1  }, // 4
    "ICEBREAKER":    { write: 40,  draw: 150, decay: 0, firstMultiplier: 1.25, fallback: -1 }, // 5
    "COMPLEMENT":    { write: 40,  draw: 150, decay: 0, firstMultiplier: 0.2 , fallback: -1 }, // 6 speedrun is 7
    "MASTERPIECE":   { write: 2,   draw: 2,   decay: 0, firstMultiplier: 1   , fallback: 1  }, // 15
    "STORY":         { write: 40,  draw: 2,   decay: 0, firstMultiplier: 1.25, fallback: 1  },
    "MISSING PIECE": { write: 2 ,  draw: 150, decay: 0, firstMultiplier: 1   , fallback: 1  },
    "CO-OP":         { write: 20,  draw: 75,  decay: 0, firstMultiplier: 1.25, fallback: 1  },
    "SANDWICH":      { write: 40,  draw: 150, decay: 0, firstMultiplier: 1.25, fallback: 1  }, // 12
    "CROWD":         { write: 20,  draw: 75,  decay: 0, firstMultiplier: 1.25, fallback: 2  }, // 13
    "BACKGROUND":    { write: 40,  draw: 150, decay: 0, firstMultiplier: 2   , fallback: 1  }, // 14
    "SOLO":          { write: 2,   draw: 2,   decay: 0, firstMultiplier: 1   , fallback: 1  }, // 15
    "EXQUISITE CORPSE": { write: 90,  draw: 300, decay: 0, firstMultiplier: 1   , fallback: 1  }, // 15
}

// Global variables
const game = {
    user: "Joyce Moore", // used by Spotlight
    turns: 0,            // used by Spotlight
    // The NORMAL settings follow
    write: 40,             // used by Timer
    draw: 150,             // used by Timer
    decay: 0,              // used by Timer
    firstMultiplier: 1.25, // used by Timer
    fallback: 2            // used by Spotlight
}

// Structures
class SettingsBelt { // derived from Circulator, derived from Iterator, trimmed
    constructor(array, defaultIndex, extension) {
        this.items = array
        this.length = array.length
        this.index = defaultIndex || 0
        this.extension = extension
    }
    current() { return this.items[this.index] }
    next() { this.index = (this.index + 1              ) % this.length; return this.current()}
    prev() { this.index = (this.index + this.length - 1) % this.length; return this.current()} // Unused

    extend() {
        if (!this.extension) { return } 
        this.length += 1; 
        this.items.push(this.extension) 
    }
    retract() {
        if (!this.extension) { return } 
        this.length -= 1
        this.items.slice(0, this.length - 1)
        if (this.index == this.length) { this.index = this.length - 1 }
    }
}
class WhiteSettingsBelt extends SettingsBelt {
    constructor(defaultState, extension) { 
        super(['off', 'on'], [1,'on',true].includes(defaultState) ? 1 : 0, extension)
    }
}
class RedSettingsBelt extends WhiteSettingsBelt {
    constructor(defaultState) { 
        super(defaultState, 'red')
    }
}
class Keybind {
    // triggeredBy   // Event => Bool
    // response      // Event => Any
    constructor(triggeredBy, response) {
        this.triggeredBy = triggeredBy;
        this.response = response;
    }
}

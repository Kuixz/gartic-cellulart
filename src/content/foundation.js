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

class WIWElement {
    element = undefined
    header = undefined
    body = undefined

    constructor(e, h=undefined, b=undefined) {
        this.element = e
        this.header = h ? h : e.querySelector('.wiw-header')
        this.body = b ? b : e.querySelector('.wiw-body')
    }

    setVisibility(v) {
        if (v === false) { 
            this.element.style.visibility = 'hidden'
        } else if (v === true) { 
            this.element.style.visibility = 'visible'
        } else {
            this.element.style.visibility = v
        }
    }
}

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
    newWIW(closeable, visible, ratio=(100/178)) {
        const newWIW = WIW.wiwNode.cloneNode(true)
        const v = visible ? "visible" : "hidden"
        // const r = ratio ? ratio : (100/178)
        closeable
            ? newWIW.querySelector(".wiw-close").onmousedown = function() { newWIW.remove() }
            : newWIW.querySelector(".wiw-close").remove()
        WIW.initDragElement(newWIW)
        WIW.initResizeElement(newWIW, ratio)
        setAttributes(newWIW, { 
            style: "visibility:" + v + "; min-height:" + (178 * ratio + 40) + "px; height:" + (178 * ratio + 40) + "px; max-height:" + (536 * ratio + 40) + "px", 
            parent: document.body 
        })
        return new WIWElement(newWIW)
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
const Console = { // Only print certain messages
    name: "Console",
    // enabled: new Set(),
    enabled: new Set([/*'Observer',*/'Socket', 'XHR']),

    toggle: function(mod) {
        this.set(mod, !this.enabled.has(mod))
    },
    set: function(mod, enabled) {
        enabled ? this.enabled.add(mod) : this.enabled.delete(mod)
        Console.log((enabled ? "Enabled " : "Disabled ") + "logging for " + mod, 'Console')
    },
    log: function(message, modName=null) {
        if (modName && !this.enabled.has(modName)) { return }
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.log(msg)
    },
    alert: function(message, modName) {
        const msg = `[${modName}] ERROR: ${message}`
        this.onprint(msg)
        console.log(msg)
    },
    onprint: function(message) {}, // Dynamically set
}; Console.enabled.add('Console')
const Shelf = { // FAKE SHELF - REMOVE THIS WHEN PUSHING BETA 
    dict: { 
        auth: "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb",
        p: "q",
    },

    async set(items) { // Dictionary<String, any>
        for (const key in items) {
            Shelf.dict[key] = items[key]
        }
    },
    async get(items) { // [String]
        switch (typeof items) {
            case 'string':
                // t[items] = Shelf.dict[items]
                // break;
                return Shelf.dict[items]
            case 'object':
                var t = {}
                items.forEach((key) => {
                    t[key] = Shelf.dict[key]
                })
                return t
                // break;
            default:
                return Shelf.dict
                // break;
        }
        // return t
    },
    async remove(items) { // [String]
        for (const key in items) {
            delete Shelf.dict[key]
        }
    },
    async clear() {
        Shelf.dict = { }
    },
    async retrieveOrElse(key, defaultValue, write = false) {
        if (key in Shelf.dict) { return Shelf.data[key] }
        if (write) { Shelf[key] = defaultValue }
        return defaultValue
    }
}
// const Shelf = {
//     // init() {
//     //     ;["session", "local"].forEach((zone) => {
//     //         Box[zone] = { }
//     //         ;["set, get"].forEach((func) => {
//     //             Box[zone][func] = async function(items) { chrome.storage[zone][func](items) }
//     //         })
//     //     })
//     // },

//     async set(items) { // Dictionary<String, any>
//         return await chrome.storage.local.set(items)
//     },
//     async get(items) { // [String]
//         return await chrome.storage.local.get(items)
//     },
//     async remove(items) { // [String]
//         return await chrome.storage.local.remove(items)
//     },
//     async clear() {
//         chrome.storage.local.clear()
//     },
//     async retrieveOrElse(key, defaultValue, write = false) {
//         const data = await chrome.storage.local.get(key)
//         if (data[key] !== undefined) { return data[key] }
//         if (write) { chrome.storage.local.set({ [key]:defaultValue }) }
//         return defaultValue
//     }
// }
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
    validated: true, //false,
    storage: null,  

    async remember(str) {
        await SHAuth.storage.set({"auth":str})
    },
    validate(str) {
        const correct = str === SHAuth.hash
        SHAuth.validated = correct
        return correct
    },
    async tryLogin() {
        const r = await SHAuth.storage.get("auth")
        // console.log(r)
        return SHAuth.validate(r)
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
    handlers: [{ filter:'log', handle:(data) => { Console.log(data, 'Socket') }}],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${data})`, 'Socket')
            Socket.handle(purp, data)
            // Socket.handlers.forEach(handler => { 
            //     if (handler.filter == purp) { handler.handle(data) }
            // })
        })
    },
    backToLobby() {
        Socket.post("backToLobby")
    },
    handle(purp, data){
        Socket.handlers.forEach(handler => { 
            if (handler.filter == purp) { handler.handle(data) }
        })
    },
    post(purp, data) {
        Console.log(`outgoing (${purp}, ${data})`, 'Socket')
        
        window.postMessage({
            direction: "toSocket",
            purpose: purp,
            data: data
        }, 'https://garticphone.com')
    },
    addMessageListener(purp, handler) {
        Socket.handlers.push({ filter:purp, handle:handler });
    }
}
const Xhr = {
    name: 'XHR',
    handlers: [{ filter:'log', handle:(data) => { Console.log(data, 'XHR') }}],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromXHR') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${data})`, 'XHR')
            Xhr.handle(purp, data)
            // Xhr.handlers.forEach(handler => { 
            //     if (handler.filter == purp) { handler.handle(data) }
            // })
        })
    },
    handle(purp, data) {
        Xhr.handlers.forEach(handler => { 
            if (handler.filter == purp) { handler.handle(data) }
        })
    },
    post(purp, data) {
        Console.log(`outgoing (${purp}, ${data})`, 'XHR')
        
        window.postMessage({
            direction: "toXHR",
            purpose: purp,
            data: data
        }, 'https://garticphone.com')
    },
    addMessageListener(purp, handler) {
        Xhr.handlers.push({ filter:purp, handle:handler });
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
// const echo = (v) => v
// const const0 = () => 0


// Global variables
// const game = {
    // user: "Joyce Moore", // used by Spotlight
    // turns: 0,            // used by Timer and Spotlight
    // The NORMAL settings follow
    // write: 40,             // used by Timer
    // draw: 150,             // used by Timer
    // decay: () => 0,                                          // used by Timer
    // firstMultiplier: 1.25, // used by Timer
    // fallback: 2            // used by Spotlight
// }
const Converter = {
    // user: 'Joyce Moore',
    // turns: 0,

    // mode: 'CUSTOM',
    // write: 40,
    // draw: 150,
    // decay: () => 0,                            
    // firstMultiplier: 1.25,
    // fallback: 2,

    // setMode(str) {
    //     Converter.mode = str
    // },
    modeParameters: {
        "NORMAL":           { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  }, // 1 -> 1
        "KNOCK-OFF":        { write: 90, draw: 300, decayFunction: (turns) => 1 / Math.exp(8 / turns), firstMultiplier: 1   , fallback: 1  }, // 2 -> 8
        "SECRET":           { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  }, // 3 -> 3
        "ANIMATION":        { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 4 -> 11
        "ICEBREAKER":       { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: -1 }, // 5 -> 9
        "COMPLEMENT":       { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 0.2 , fallback: -1 }, // 6 -> 15
        // speedrun is 7 (what? no it isn't???)
        "MASTERPIECE":      { write: 2,  draw: 2,   decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 15 -> 20
        "STORY":            { write: 40, draw: 2,   decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 1  },       // 17
        "MISSING PIECE":    { write: 2 , draw: 150, decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  },       // 21 
        "CO-OP":            { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 1  },       // 18
        "SCORE":            { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  },       // 10
        "SANDWICH":         { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 1  }, // 12 -> 5
        "CROWD":            { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  }, // 13 -> 7
        "BACKGROUND":       { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 2   , fallback: 1  }, // 14 -> 14
        "SOLO":             { write: 2,  draw: 2,   decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 15 -> 13
        "EXQUISITE CORPSE": { write: 90, draw: 300, decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }
    },

    getParameters(str) {
        return Converter.modeParameters[str]
    },

    modeIndexToString(index) {
        return ([0,'NORMAL',2,'SECRET',4,'SANDWICH',6,'CROWD','KNOCK-OFF','ICEBREAKER','SCORE','ANIMATION',12,'SOLO','BACKGROUND','COMPLEMENT',16,'STORY','CO-OP',19,'MASTERPIECE', 'MISSING PIECE',22,23,'EXQUISITE CORPSE'])[index]
    },

    timeIndexToString(index) {
        return ([0,"SLOW","NORMAL","FAST","DYNAMIC","REGRESSIVE","INFINITE","HOST'S DECISION","PROGRESSIVE","FASTER FIRST TURN","SLOWER FIRST TURN"])[index]
    },
    timeStringToParameters(str) {
        switch (str) { // Setting custom game.parameters
            case "SLOW":              return { "write": 80, "draw": 300, 'decayFunction': () => 0, "firstMultiplier": 1.25 };
            case "NORMAL":            return Converter.getParameters(["NORMAL"]);
            case "FAST":              return Converter.getParameters(["SECRET"]);
            case "PROGRESSIVE":       return { "write": 8, "draw": 30, "firstMultiplier": 1, "decayFunction": (turns) => Math.exp(8 / turns)};
            case "REGRESSIVE":        return /*{ ...*/Converter.getParameters(['KNOCK-OFF']) /*, "decay": 1 / Math.exp(8 / game.turns) }*/;
            case "DYNAMIC":           return Converter.getParameters(["SOLO"]);
            case "INFINITE":          return Converter.getParameters(["SOLO"]);
            case "HOST'S DECISION":   return Converter.getParameters(["SOLO"]);
            case "FASTER FIRST TURN": return Converter.getParameters(["COMPLEMENT"]);
            case "SLOWER FIRST TURN": return Converter.getParameters(["BACKGROUND"]);
            default: Console.alert("Could not identify the time setting being used", 'Converter'); return {}
        }
    },

    flowIndexToString(index) {
        return ([0,"WRITING, DRAWING","DRAWING, WRITING","ONLY DRAWING","WRITING ONLY AT THE BEGINNING AND END","WRITING ONLY AT THE BEGINNING","WRITING ONLY AT THE END","SINGLE SENTENCE",'SINGLE DRAWING','SOLO DRAWING','DRAWINGS WITH A BACKGROUND','DRAWINGS WITH A BACKGROUND, NO PREVIEW',"ONLY WRITING"])[index]
    },
    flowStringToFallback(str) {
        switch (str) { 
            case "WRITING, DRAWING":                     return 2;
            case "DRAWING, WRITING":                     return 2;
            case "SINGLE SENTENCE":                      return -1;
            case "SINGLE DRAWING":                       return -1;
            case "DRAWINGS WITH A BACKGROUND":             return -1;
            case "DRAWINGS WITH A BACKGROUND, NO PREVIEW": return -1;
            default:                                     return 1;
        }
    },

    turnsIndexToString(index) {
        return ([0,"FEW","MOST","ALL","200%","300%","SINGLE TURN","5 TURNS","10 TURNS","20 TURNS","2 TURNS","3 TURNS","ALL +1","6 TURNS","7 TURNS","8 TURNS","9 TURNS","4 TURNS",])[index]
    },
    turnsStringToFunction(str) {
        return (players) => {
            switch (str) {
                case "FEW":         return Math.floor(players / 2);     // [C3]
                case "MOST":        return Math.floor(3 * players / 4); // [C3]
                case "ALL":         return players; 
                case "ALL +1":      return players + 1;
                case "200%":        return 2 * players;
                case "300%":        return 3 * players;
                case "SINGLE TURN": return 1;
                case "2 TURNS":     return 2;
                case "3 TURNS":     return 3;
                case "4 TURNS":     return 4;
                case "5 TURNS":     return 5;
                case "6 TURNS":     return 6;
                case "7 TURNS":     return 7;
                case "8 TURNS":     return 8;
                case "9 TURNS":     return 9;
                case "10 TURNS":    return 10;
                case "20 TURNS":    return 20;
                default: Console.alert("Could not identify the turn setting being used", 'Converter'); return 0;
            }
        }
    }
}

// Structures
class SettingsBelt { // derived from Circulator, derived from Iterator, trimmed
    constructor(array, defaultIndex, extension) {
        this.items = array
        this.length = array.length
        this.index = defaultIndex || 0
        this.extension = extension
    }
    current() { return this.items[this.index] }  // TODO: change this to get syntax
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


// module.exports = { this.wdinwos }
if (typeof exports !== 'undefined') {
    module.exports = { gifenc, WIW, Console, Shelf, Keybinder, SHAuth, Socket, Xhr, clamp, preventDefaults, setAttributes, svgNS, configChildTrunk, Converter, SettingsBelt, WhiteSettingsBelt, RedSettingsBelt, Keybind };
    // module.exports = { ...Object.entries(this) }
    // module.exports = { ...Object.entries(window) }
    // module.exports = { ...Object.values(this) }
}
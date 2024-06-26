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

class InwindowElement {
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

const Inwindow = {
    wiwNode: undefined, // HTMLDivElement
    currentZIndex: 20,  // todo reset z index when a threshold is passed

    constructNode(customNode) {
        if (customNode) { Inwindow.wiwNode = customNode; return }
        Inwindow.wiwNode = setAttributes(document.createElement("div"), { style: "visibility: hidden", class: "window-in-window" })
        Inwindow.wiwNode.innerHTML = `
            <div class = "wiw-header">≡<div class = "wiw-close"></div></div>
            <div class = "wiw-body"></div>`
    },
    new(closeable, visible, ratio=(100/178)) {
        const newWIW = Inwindow.wiwNode.cloneNode(true)
        const v = visible ? "visible" : "hidden"
        // const r = ratio ? ratio : (100/178)
        closeable
            ? newWIW.querySelector(".wiw-close").onmousedown = function() { newWIW.remove() }
            : newWIW.querySelector(".wiw-close").remove()
        Inwindow.initDragElement(newWIW)
        Inwindow.initResizeElement(newWIW, ratio)
        setAttributes(newWIW, { 
            style: "visibility:" + v + "; min-height:" + (178 * ratio + 40) + "px; height:" + (178 * ratio + 40) + "px; max-height:" + (536 * ratio + 40) + "px", 
            parent: document.body 
        })
        return new InwindowElement(newWIW)
    },
    // The below code is taken from Janith at https://codepen.io/jkasun/pen/QrLjXP
    // and is used to make the various window-in-windows movable.
    initDragElement(element) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        var elmnt = null;
        var header = getHeader(element);
        
        element.onmousedown = function() {
            this.style.zIndex = String(++Inwindow.currentZIndex);
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
    enabled: new Set([/*'Observer',*//*'Socket', */'Spotlight', 'Xhr']),

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
// const Shelf = { // FAKE SHELF - REMOVE THIS WHEN PUSHING BETA 
//     dict: { 
//         auth: "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb",
//         p: "q",
//     },

//     async set(items) { // Dictionary<String, any>
//         for (const key in items) {
//             Shelf.dict[key] = items[key]
//         }
//     },
//     async get(items) { // [String]
//         switch (typeof items) {
//             case 'string':
//                 // t[items] = Shelf.dict[items]
//                 // break;
//                 return Shelf.dict[items]
//             case 'object':
//                 var t = {}
//                 items.forEach((key) => {
//                     t[key] = Shelf.dict[key]
//                 })
//                 return t
//                 // break;
//             default:
//                 return Shelf.dict
//                 // break;
//         }
//         // return t
//     },
//     async remove(items) { // [String]
//         for (const key in items) {
//             delete Shelf.dict[key]
//         }
//     },
//     async clear() {
//         Shelf.dict = { }
//     },
//     async retrieveOrElse(key, defaultValue, write = false) {
//         if (key in Shelf.dict) { return Shelf.data[key] }
//         if (write) { Shelf[key] = defaultValue }
//         return defaultValue
//     }
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

// Branches
const Socket = {
    name: 'Socket',
    handlers: [{ filter:'log', handle:(data) => { Console.log(data, 'Socket') }}],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'Socket')
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
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'XHR')
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
    // post(purp, data) {
    //     Console.log(`outgoing (${purp}, ${data})`, 'XHR')
        
    //     window.postMessage({
    //         direction: "toXHR",
    //         purpose: purp,
    //         data: data
    //     }, 'https://garticphone.com')
    // },
    addMessageListener(purp, handler) {
        Xhr.handlers.push({ filter:purp, handle:handler });
    }
}
// const Worker = {
//     name: "Worker",

//     keepAliveCallback: null,

//     setKeepAlive(alive = true) {
//         if (alive) {
//             Worker.keepAliveCallback = setInterval(() => Worker.messageToWorker(2), 250)
//         } else {
//             if (Worker.keepAliveCallback) { clearInterval(Worker.keepAliveCallback); Worker.keepAliveCallback = null }
//         }
//     },
//     async messageToWorker(purpose, data=undefined) {
//         const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
//         const response = await chrome.runtime.sendMessage(message);
//         Console.log(response, 'Worker') 
//         return response
//     },
// }

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
    host: "Kirsten Wright",
    user: "Joyce Moore", // used by Spotlight
    // The NORMAL settings follow
    players: [],
    // flow: 'WRITING, DRAWING',
    // speed: 'NORMAL',
    turns: 0,

    flowString: 'WRITING, DRAWING',
    speedString: 'NORMAL',
    turnsString: 'ALL',
    // turns: () => 0,
    // turns: 0,            // used by Timer and Spotlight

    // write: 40,             // used by Timer
    // draw: 150,             // used by Timer
    // decay: () => 0,                                          // used by Timer
    // firstMultiplier: 1.25, // used by Timer
    // fallback: 2            // used by Spotlight
    roundStart() {
        this.turns = Converter.turnsStringToFunction(this.turnsString)(this.players.length)
    }
}
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
        "NORMAL":           { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING, DRAWING'  }, // 1 -> 1
        "KNOCK-OFF":        { speed: 'REGRESSIVE', turns: 'ALL', flow: 'ONLY DRAWINGS'  }, // 2 -> 8
        "SECRET":           { speed: 'FAST', turns: 'ALL', flow: 'WRITING, DRAWING' }, // 3 -> 3
        "ANIMATION":        { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY DRAWINGS' }, // 4 -> 11
        "ICEBREAKER":       { speed: 'NORMAL', turns: 'ALL +1', flow: 'SINGLE SENTENCE'  }, // 5 -> 9
        "COMPLEMENT":       { speed: 'FASTER FIRST TURN', turns: 'ALL +1', flow: 'DRAWINGS WITH A BACKGROUND, NO PREVIEW' }, // 6 -> 15
        // speedrun is 7 (what? no it isn't???)
        "MASTERPIECE":      { speed: "HOST'S DECISION", turns: 'SINGLE TURN', flow: 'SOLO DRAWING' }, // 15 -> 20
        "STORY":            { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY WRITING' },       // 17
        "MISSING PIECE":    { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY DRAWINGS' },       // 21 
        "CO-OP":            { speed: 'FAST', turns: '6 TURNS', flow: 'SINGLE SENTENCE' },       // 18
        "SCORE":            { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING, DRAWING' },       // 10
        "SANDWICH":         { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING ONLY AT THE BEGINNING AND THE END' },      // 12 -> 5
        // "CROWD":            { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  }, // 13 -> 7
        "BACKGROUND":       { speed: 'SLOWER FIRST TURN', turns: '200%', flow: 'DRAWINGS WITH A BACKGROUND' }, // 14 -> 14
        "SOLO":             { speed: 'DYNAMIC', turns: '5 TURNS', flow: 'SOLO DRAWING' }, // 15 -> 13
        "EXQUISITE CORPSE": { speed: 'SLOW', turns: '3 TURNS', flow: 'ONLY DRAWINGS'}
    },
    speedParameters: {
        "SLOW":              { write: 80, draw: 300, decayFunction: () => 0,                            firstMultiplier: 1.25 },
        "NORMAL":            { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25 }, // 1 -> 1
        "FAST":              { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25 }, // 3 -> 3
        "PROGRESSIVE":       { write: 8,  draw: 30,  decayFunction: (turns) => Math.exp(8 / turns),     firstMultiplier: 1, },
        "REGRESSIVE":        { write: 90, draw: 300, decayFunction: (turns) => 1 / Math.exp(8 / turns), firstMultiplier: 1   , fallback: 1  }, // 2 -> 8
        "DYNAMIC":           { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 15 -> 13
        "INFINITE":          { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 15 -> 13
        "HOST'S DECISION":   { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }, // 15 -> 13
        "FASTER FIRST TURN": { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 0.2 , fallback: -1 }, // 6 -> 15
        "SLOWER FIRST TURN": { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 2   , fallback: 1  }, // 14 -> 14
    },

    getParameters(str) {
        return Converter.modeParameters[str]
    },

    modeIndexToString(index) {
        return ([0,'NORMAL',2,'SECRET',4,'SANDWICH',6,'CROWD','KNOCK-OFF','ICEBREAKER','SCORE','ANIMATION',12,'SOLO','BACKGROUND','COMPLEMENT',16,'STORY','CO-OP',19,'MASTERPIECE', 'MISSING PIECE',22,23,'EXQUISITE CORPSE'])[index]
    },

    speedIndexToString(index) {
        return ([0,"SLOW","NORMAL","FAST","DYNAMIC","REGRESSIVE","INFINITE","HOST'S DECISION","PROGRESSIVE","FASTER FIRST TURN","SLOWER FIRST TURN"])[index]
    },
    speedStringToParameters(str) {
        // switch (str) { // Setting custom game.parameters
        //     case "SLOW":              return { "write": 80, "draw": 300, 'decayFunction': () => 0, "firstMultiplier": 1.25 };
        //     case "NORMAL":            return Converter.getParameters(["NORMAL"]);
        //     case "FAST":              return Converter.getParameters(["SECRET"]);
        //     case "PROGRESSIVE":       return { "write": 8, "draw": 30, "firstMultiplier": 1, "decayFunction": (turns) => Math.exp(8 / turns)};
        //     case "REGRESSIVE":        return /*{ ...*/Converter.getParameters(['KNOCK-OFF']) /*, "decay": 1 / Math.exp(8 / game.turns) }*/;
        //     case "DYNAMIC":           return Converter.getParameters(["SOLO"]);
        //     case "INFINITE":          return Converter.getParameters(["SOLO"]);
        //     case "HOST'S DECISION":   return Converter.getParameters(["SOLO"]);
        //     case "FASTER FIRST TURN": return Converter.getParameters(["COMPLEMENT"]);
        //     case "SLOWER FIRST TURN": return Converter.getParameters(["BACKGROUND"]);
        //     default: Console.alert("Could not identify the time setting being used", 'Converter'); return {}
        // }
        const k = Converter.speedParameters[str]
        if (k) { return k }
        Console.alert(`Could not identify the time setting being used (${str})`, 'Converter'); return {}
        // return Converter.speedParameters[str]
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
        switch (str) {
            case "FEW":         return (players) => Math.floor(players / 2);     // [C3]
            case "MOST":        return (players) => Math.floor(3 * players / 4); // [C3]
            case "ALL":         return (players) => players; 
            case "ALL +1":      return (players) => players + 1;
            case "200%":        return (players) => 2 * players;
            case "300%":        return (players) => 3 * players;
            case "SINGLE TURN": return (players) => 1;
            case "2 TURNS":     return (players) => 2;
            case "3 TURNS":     return (players) => 3;
            case "4 TURNS":     return (players) => 4;
            case "5 TURNS":     return (players) => 5;
            case "6 TURNS":     return (players) => 6;
            case "7 TURNS":     return (players) => 7;
            case "8 TURNS":     return (players) => 8;
            case "9 TURNS":     return (players) => 9;
            case "10 TURNS":    return (players) => 10;
            case "20 TURNS":    return (players) => 20;
            default: 
                Console.alert("Could not identify the turn setting being used", 'Converter');
                return (players) => { Console.alert("Could not identify the turn setting being used", 'Converter'); return 0; }
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
    get current() { return this.items[this.index] }  // TODO: change this to get syntax
    // isSetTo(thing) { return this.current == thing }
    next() { this.index = (this.index + 1              ) % this.length; return this.current}
    prev() { this.index = (this.index + this.length - 1) % this.length; return this.current} // Unused

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
    jump(setting) {
        while (this.current != setting) { this.next() }
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
// class Throttle {
//     semaphores = {}

//     constructor(semaphores) {
//         this.semaphores = semaphores
//     }
//     up (semaphore) {
//         this.semaphores[semaphore] = true
//     }
//     down (semaphore) {
//         this.semaphores[semaphore] = false
//     }
//     async get () {
//         
//     }
// }


// module.exports = { this.wdinwos }
if (typeof exports !== 'undefined') {
    module.exports = { gifenc, Inwindow, Console, Shelf, Keybinder, SHAuth, Socket, Xhr, clamp, preventDefaults, setAttributes, svgNS, configChildTrunk, game, Converter, SettingsBelt, WhiteSettingsBelt, RedSettingsBelt, Keybind };
    // module.exports = { ...Object.entries(this) }
    // module.exports = { ...Object.entries(window) }
    // module.exports = { ...Object.values(this) }
}
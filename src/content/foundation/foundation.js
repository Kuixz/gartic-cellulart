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


// Submodule functionalities
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
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
 /* ----------------------------------------------------------------------
  *                              Foundation 
  *           With credit to Janith (https://codepen.io/jaksun)
  * ---------------------------------------------------------------------- */ 

// Libraries
// var gifenc;
// (async () => {
//     const src = chrome.runtime.getURL("src/lib/gifenc.esm.mjs");
//     gifenc = await import(src);
// })(); // setTimeout(function(){console.log(gifenc); console.log(gifenc.GIFEncoder); console.log(gifenc.quantize)}, 1000)

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


// Structures

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
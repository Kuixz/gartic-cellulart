import CellulartModule from "./CellulartModule.js";
// import { Converter } from "../foundation"
import { 
    WhiteSettingsBelt,
    Console, 
    Converter, 
    setAttributes 
} from "../foundation/index.js";


/* ----------------------------------------------------------------------
  *                                 Timer 
  * ---------------------------------------------------------------------- */
/** Timer adds a digital timer displaying time remaining (or elapsed) 
  * in the top right corner, just under the analog clock.              
  * ---------------------------------------------------------------------- */
const Timer = {
   
    name : "Timer",
    setting : new WhiteSettingsBelt('on'),
    // Timer variables 
    display : undefined, // HTMLDivElement
    countdown : undefined, // timeoutID

    write: 40,             // used by Timer
    draw: 150,             // used by Timer
    decay: 0,              // used by Timer
    // decayFunction: () => 0,
    firstMultiplier: 1.25, // used by Timer

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (["book", "start"].includes(newPhase)) { return }
        if (game.turns == 0) { this.finalizeTurns() }
        setTimeout(() => { this.placeTimer() }, 200)

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        clearTimeout(this.countdown)
        setTimeout((x) => { this.restartTimer(x) }, 200, newPhase)
    },
    backToLobby(oldPhase) {
        // this.turns = 0
    }, // Empty.
    adjustSettings(previous, current) {
        if (this.display == undefined) { return }
        if (current == "on") { this.display.style.visibility = "visible" } else { this.display.style.visibility = "hidden" }
    },
    roundStart() {
        // const data = dict.custom
        const parameters = Converter.speedStringToParameters(game.speedString)
        this.decay = parameters.decayFunction(game.turns)
        // delete parameters.turns
        Object.assign(this, parameters)  // TODO: unsafe and unscalable
    },
    // updateLobbySettings(dict) {
    //     if ("default" in dict) {
    //         const data = dict.default
    //         const parameters = Converter.getParameters(data)
    //         Object.assign(this, parameters)  // TODO: unsafe and unscalable
    //         // console.log(g)
    //     }
    //     if ("custom" in dict) {
    //         const data = dict.custom
    //         // const players = "players" in dict ? dict.players : 1
    //         // this.turnsFunction = Converter.turnsStringToFunction(data[2]) // (players) 
    //         const parameters = Converter.speedStringToParameters(data[0])
    //         Object.assign(this, parameters)  // TODO: unsafe and unscalable
    //     }
    // },

    // templateParameters(data) {
    //     Object.assign(this.parameters, Converter.getParameters(Converter.modeIndexToString(data)))
    // },
    // adjustParameters(parameters) {
    //     const config = parameters.configs
    //     // const midgame = parameters.turnMax > 0

    //     // Timer.parameters.players = parameters.users.length;
    //     if ('speed' in config) { Object.assign(this, Converter.speedStringToParameters(Converter.speedIndexToString(config.speed))) }  // TODO: unsafe and unscalable
    //     // Timer.tweakParameters(config, midgame)

    //     if (parameters.turnMax > 0) {
    //     // if (midgame) {
    //         // todo: in theory we should pass these through to all the modules, but ehh.
    //         // Timer.parameters.turns = parameters.turnMax
    //         Timer.interpolate(parameters.turnNum)
    //         // Timer.finalizeTurns(Timer.parameters.players)
    //     }
    // },
    // tweakParameters(config, midgame=false) {
    //     // if ('turns' in config) { Timer.parameters.turnsFunction = midgame ? () => { return parameters.turnMax } : Converter.turnsStringToFunction(Converter.turnsIndexToString(config.turns)) }  // (players) 
    //     if ('speed' in config) { Object.assign(this.parameters, Converter.speedStringToParameters(Converter.speedIndexToString(config.speed))) }
    // },
    // finalizeTurns() {
    //     const step = document.querySelector('.step')
    //     if (!step) { setTimeout(() => { this.finalizeTurns() }, 200)}
    //     // if (newPhase != 'book') { 
    //         // setTimeout(() => {
    //         // if (this.parameters.turns == 0) { 
    //     // const d = this.parameters.turns; if (t 
    //     const indicator = step.querySelector('p').textContent
    //     this.turns = Number(indicator.slice(indicator.indexOf('/') + 1))
            
    //         // }
    //         // return
    //     // }
    // // finalizeTurns(players) {
    //     // const t = Timer.parameters.turns; if (t instanceof Function) { Timer.parameters.turns = t(players) }
    //     this.decay = this.decayFunction(this.turns)
    //     // }, 200);
    // },

    placeTimer() {  // [T3]
        // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }

        // todo: is it even possible to run a rescue scheme, given that we pluck the clock and stick it in the holder?
        const clock = document.querySelector(".time");

        const holder = setAttributes(document.createElement("div"), { id: "clocksticles" })
        clock.insertAdjacentElement("beforebegin", holder) // These two lines
        holder.appendChild(clock)                          // finesse the clock into its holder.

        const timerHolder = setAttributes(document.createElement("div"), { id: "timerHolder", parent: holder })

        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))
        this.display = setAttributes(document.createElement("div"), { id: "timer", style: `visibility:${this.isSetTo('off') ? "hidden" : "visible"}`, parent: timerHolder })

        const p = clock.querySelector('p'); if (p) { p.style.visibility = "hidden" }
    },
    restartTimer(newPhase) {
        const clock = document.querySelector(".time")
        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if(p) { p.style.visibility = "hidden" } // Prevents clashing with SillyV's extension
            this.tick(1, 1)
        } else {
            var seconds = this.getSecondsForPhase(newPhase)
            if (seconds == -1) {
                this.tick(1, 1)
            }
            else {
                this.tick(seconds - 1, -1)
            }
        }
        // if (game.parameters["timerCurve"] != 0) { 
        this.interpolate(1); 
        // }
    },
    getSecondsForPhase(newPhase) {
        Console.log("I think this phase is " + newPhase, 'Timer');
        var toReturn = 0;
        switch (newPhase) {
            case 'draw': case 'memory': 
                // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST
                if (![1,1.25].includes(this.firstMultiplier) && document.querySelector(".step").textContent.slice(0, 2) == "1/") {
                    toReturn = 150 * this.firstMultiplier;  // Experimental optimization replacing this.draw with flat 150
                } else { 
                    toReturn = this.draw;
                } break;
            case 'write': toReturn = this.write; break;
            case 'first': toReturn = this.write * this.firstMultiplier; break;
            case 'mod':   return 25 // 10 // [T2]
            default:
                Console.alert("Could not determine duration of phase " + newPhase, 'Timer')
                return 0
        }
        return Math.floor(toReturn)
    },
    tick(seconds, direction) {
        const h = String(Math.floor(seconds / 3600)) + ":"
        const m = String(Math.floor(seconds / 60)) + ":"
        var s = String(seconds % 60);
        if (s.length < 2) { s = 0 + s }
        this.display.textContent = h == "0:" ? m + s : h + m + s

        if (seconds <= 0 || !this.display) { Console.log("Countdown ended", 'Timer'); return }
        this.countdown = setTimeout((s,d) => { this.tick(s,d) }, 1000, seconds + direction, direction)
    },
    interpolate(times) {
        if (this.decay != 0) {
            Console.log("Interpolating regressive/progressive timer", 'Timer')
            this.write = (this.write - 8) * (this.decay ** times) + 8
            this.draw = (this.draw - 30) * (this.decay ** times) + 30
        } 
    },

    // deduceSettingsFromXHR(data) {
    //     console.log(data)
    // },
    // deduceSettingsFromSocket(data) {

    // }
};
Object.setPrototypeOf(Timer, CellulartModule)

export default Timer
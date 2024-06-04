
import CellulartModule from "./CellulartModule";
import {
    Console,
    Converter,
    WhiteSettingsBelt,
    setAttributes
} from "../foundation.js"

/* ----------------------------------------------------------------------
  *                                 Timer
  * ---------------------------------------------------------------------- */
/** Timer adds a digital timer displaying time remaining (or elapsed)
  * in the top right corner, just under the analog clock.
  * ---------------------------------------------------------------------- */
const Timer = {
    name: "Timer",
    setting: new WhiteSettingsBelt('on'),
    // Timer variables 
    display: undefined, // HTMLDivElement
    countdown: undefined, // timeoutID

    parameters: {
        players: 0,
        turns: 0, // used by Timer 
        turnsFunction: () => { },
        write: 40, // used by Timer
        draw: 150, // used by Timer
        decay: 0, // used by Timer
        decayFunction: () => { },
        firstMultiplier: 1.25, // used by Timer
    },

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (["book", "start"].includes(newPhase)) { return; }
        if (Timer.parameters.turns == 0) { Timer.finalizeTurns(); }
        setTimeout(Timer.placeTimer, 200);

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return; } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        clearTimeout(Timer.countdown);
        setTimeout(Timer.restartTimer, 200, newPhase);
    },
    backToLobby(oldPhase) {
        Timer.parameters.turns = 0;
    }, // Empty.
    adjustSettings(previous, current) {
        if (Timer.display == undefined) { return; }
        if (current == "on") { Timer.display.style.visibility = "visible"; } else { Timer.display.style.visibility = "hidden"; }
    },
    update42(type, data) {
        switch (type) {
            case 1: Timer.adjustParameters(data); break;
            // case 2: Timer.parameters.players += 1; break;
            // case 3: Timer.parameters.players -= 1; break;
            // case 5: Timer.finalizeTurns(); break;
            case 18: Timer.tweakParameters(data); break;
            case 26: Timer.templateParameters(data); break;
        }
    },

    templateParameters(data) {
        Object.assign(Timer.parameters, Converter.getParameters(Converter.modeIndexToString(data)));
    },
    adjustParameters(parameters) {
        const config = parameters.configs;
        // const midgame = parameters.turnMax > 0
        // Timer.parameters.players = parameters.users.length;
        if ('speed' in config) { Object.assign(Timer.parameters, Converter.timeStringToParameters(Converter.timeIndexToString(config.speed))); }
        // Timer.tweakParameters(config, midgame)
        // if (midgame) {
        if (parameters.turnMax > 0) {
            // todo: in theory we should pass these through to all the modules, but ehh.
            // Timer.parameters.turns = parameters.turnMax
            Timer.interpolate(parameters.turnNum);
            // Timer.finalizeTurns(Timer.parameters.players)
        }
    },
    // tweakParameters(config, midgame=false) {
    //     // if ('turns' in config) { Timer.parameters.turnsFunction = midgame ? () => { return parameters.turnMax } : Converter.turnsStringToFunction(Converter.turnsIndexToString(config.turns)) }  // (players) 
    //     if ('speed' in config) { Object.assign(Timer.parameters, Converter.timeStringToParameters(Converter.timeIndexToString(config.speed))) }
    // },
    finalizeTurns() {
        // if (newPhase != 'book') { 
        setTimeout(() => {
            // if (Timer.parameters.turns == 0) { 
            // const d = Timer.parameters.turns; if (t 
            const indicator = document.querySelector('.step').querySelector('p').textContent;
            Timer.parameters.turns = Number(indicator.slice(indicator.indexOf('/') + 1));

            // }
            // return
            // }
            // finalizeTurns(players) {
            // const t = Timer.parameters.turns; if (t instanceof Function) { Timer.parameters.turns = t(players) }
            Timer.parameters.decay = Timer.parameters.decayFunction(Timer.parameters.turns);
        }, 200);
    },

    placeTimer() {
        // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }
        // todo: is it even possible to run a rescue scheme, given that we pluck the clock and stick it in the holder?
        const clock = document.querySelector(".time");

        const holder = setAttributes(document.createElement("div"), { id: "clocksticles" });
        clock.insertAdjacentElement("beforebegin", holder); // These two lines
        holder.appendChild(clock); // finesse the clock into its holder.

        const timerHolder = setAttributes(document.createElement("div"), { id: "timerHolder", parent: holder });

        Timer.display = setAttributes(document.createElement("div"), { id: "timer", style: "visibility:" + Timer.setting.current() == 'off' ? "hidden" : "visible", parent: timerHolder });

        const p = clock.querySelector('p'); if (p) { p.remove(); }
    },
    restartTimer(newPhase) {
        const clock = document.querySelector(".time");
        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if (p) { p.style.visibility = "hidden"; } // Prevents clashing with SillyV's extension
            Timer.tick(1, 1);
        } else {
            Timer.tick(Timer.getSecondsForPhase(newPhase) - 1, -1);
        }
        // if (game.parameters["timerCurve"] != 0) { 
        Timer.interpolate(1);
        // }
    },
    getSecondsForPhase(newPhase) {
        Console.log("I think this phase is " + newPhase, 'Timer');
        var toReturn = 0;
        switch (newPhase) {
            case 'draw': case 'memory':
                // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST
                if (![1, 1.25].includes(Timer.parameters.firstMultiplier) && document.querySelector(".step").textContent.slice(0, 2) == "1/") {
                    toReturn = 150 * Timer.parameters.firstMultiplier; // Experimental optimization replacing Timer.parameters.draw with flat 150
                } else {
                    toReturn = Timer.parameters.draw;
                } break;
            case 'write': toReturn = Timer.parameters.write; break;
            case 'first': toReturn = Timer.parameters.write * Timer.parameters.firstMultiplier; break;
            case 'mod': return 25; // 10 // [T2]
            default:
                Console.alert("Could not determine duration of phase " + newPhase, 'Timer');
                return 0;
        }
        return Math.floor(toReturn);
    },
    tick(seconds, direction) {
        const h = String(Math.floor(seconds / 3600)) + ":";
        const m = String(Math.floor(seconds / 60)) + ":";
        var s = String(seconds % 60);
        if (s.length < 2) { s = 0 + s; }
        Timer.display.textContent = h == "0:" ? m + s : h + m + s;

        if (seconds <= 0 || !Timer.display) { Console.log("Countdown ended", 'Timer'); return; }
        Timer.countdown = setTimeout(Timer.tick, 1000, seconds + direction, direction);
    },
    interpolate(times) {
        if (Timer.parameters.decay != 0) {
            Console.log("Interpolating regressive/progressive timer", 'Timer');
            Timer.parameters.write = (Timer.parameters.write - 8) * (Timer.parameters.decay ** times) + 8;
            Timer.parameters.draw = (Timer.parameters.draw - 30) * (Timer.parameters.decay ** times) + 30;
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
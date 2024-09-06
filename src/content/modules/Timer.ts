import { 
    Phase, Console, setAttributes, setParent,
    WhiteSettingsBelt, Converter, globalGame, SpeedParameters, speedParameterDefaults, DOMUNLOADINGALLOWANCE 
} from "../foundation";
import { CellulartModule } from "./CellulartModule";

enum Count {
    Up = 1,
    Down = -1
}

/* ----------------------------------------------------------------------
  *                                 Timer 
  * ---------------------------------------------------------------------- */
/** Timer adds a digital timer displaying time remaining (or elapsed) 
  * in the top right corner, just under the analog clock.              
  * ---------------------------------------------------------------------- */
class Timer extends CellulartModule {
    name = "Timer"
    setting = WhiteSettingsBelt(this.name.toLowerCase(), true)

    // Timer variables 
    display : HTMLDivElement | undefined // HTMLDivElement
    countdown: number | undefined        // timeoutID
    parameters: SpeedParameters = speedParameterDefaults
    decay: number = 0              // used by Timer

    constructor() { // Empty.
        super()
    }  // TODO: Elements normally aren't actually destroyed when they're removed from DOM. Maybe this.display still exists between transitions? If so we can avoid the costly thing.
    mutation(oldPhase: Phase, newPhase: Phase): void {
        if (["book", "start"].includes(newPhase)) { return }
        setTimeout(this.placeTimer.bind(this), DOMUNLOADINGALLOWANCE)

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        clearTimeout(this.countdown)
        setTimeout(this.restartTimer.bind(this), DOMUNLOADINGALLOWANCE, newPhase)
    }
    roundStart(): void {
        // const data = dict.custom
        const parameters = Converter.speedStringToParameters(globalGame.speedString)
        this.decay = parameters.decayFunction(globalGame.turns)
        // delete parameters.turns
        Object.assign(this.parameters, parameters)  // TODO: unsafe and unscalable
    }
    roundEnd(): void {} // Empty.
    adjustSettings(previous: string, current: string): void {
        if (this.display == undefined) { return }
        if (current == "on") { this.display.style.visibility = "visible" } else { this.display.style.visibility = "hidden" }
    }

    placeTimer() {  // [T3]
        // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }

        // todo: is it even possible to run a rescue scheme, given that we pluck the clock and stick it in the holder?
        const clock = document.querySelector(".time") 
        if (!clock) { Console.alert("Could not find clock", "Timer"); return }

        const clockFrame = document.createElement("div")
        setAttributes(clockFrame, { id: "clocksticles" })
        clock.insertAdjacentElement("beforebegin", clockFrame) // These two lines
        clockFrame.appendChild(clock)                          // finesse the clock into its holder.

        const timerDisplay = document.createElement("div")
        setAttributes(timerDisplay, { id: "timerHolder" })
        setParent(timerDisplay, clockFrame)

        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))
        const display = document.createElement("div")
        setAttributes(display, { id: "timer", style: `visibility:${this.isSetTo('off') ? "hidden" : "visible"}` })
        setParent(display, timerDisplay)
        this.display = display

        const p = clock.querySelector('p'); if (p) { p.style.visibility = "hidden" }
    }
    restartTimer(newPhase: Phase) {
        const clock = document.querySelector(".time")
        if (!clock) { Console.alert("Could not find clock", "Timer"); return }

        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if(p) { p.style.visibility = "hidden" } // Prevents clashing with SillyV's extension
            this.tick(1, 1)
        } else {
            var seconds = this.getSecondsForPhase(newPhase)
            if (seconds == -1) {
                this.tick(1, Count.Up)
            }
            else {
                this.tick(seconds - 1, -1)
            }
        }
        // if (game.parameters["timerCurve"] != 0) { 
        this.interpolate(1); 
        // }
    }
    getSecondsForPhase(newPhase: Phase): number {
        Console.log("I think this phase is " + newPhase, 'Timer');

        const step = document.querySelector(".step")
        if (!step) { Console.alert("Could not find turn counter", "Timer"); return -1 }
        if (!(step.textContent)) { Console.alert("Could not read turn counter", "Timer"); return -1 }

        var toReturn = 0;
        switch (newPhase) {
            case "draw": 
            case "memory": 
                // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST

                if (step.textContent.slice(0, 2) == "1/" && ![1,1.25].includes(this.parameters.firstMultiplier)){
                    toReturn = 150 * this.parameters.firstMultiplier;  // Bad premature optimization replacing this.draw with flat 150
                } else { 
                    toReturn = this.parameters.draw;
                } break;
            case "write": toReturn = this.parameters.write; break;
            case "first": toReturn = this.parameters.write * this.parameters.firstMultiplier; break;
            case "mod":   return 25 // 10 // [T2]
            default:
                Console.alert("Could not determine duration of phase " + newPhase, 'Timer')
                return 0
        }
        return Math.floor(toReturn)
    }
    tick(seconds: number, increaseStep: Count) {
        const display = this.display ?? document.querySelector("#timer")
        if (!display) { Console.alert("Houston we've lost our clock", "Timer"); return }

        const h = String(Math.floor(seconds / 3600)) + ":"
        const m = String(Math.floor(seconds / 60)) + ":"
        var s = String(seconds % 60);
        if (s.length < 2) { s = 0 + s }
        display.textContent = h == "0:" ? m + s : h + m + s

        if (seconds <= 0 || !this.display) { Console.log("Countdown ended", 'Timer'); return }
        this.countdown = window.setTimeout(this.tick.bind(this), 1000, seconds + increaseStep, increaseStep)
    }
    interpolate(times: number) {
        if (this.decay != 0) {
            Console.log("Interpolating regressive/progressive timer", 'Timer')
            this.parameters.write = (this.parameters.write - 8) * (this.decay ** times) + 8
            this.parameters.draw  = (this.parameters.draw - 30) * (this.decay ** times) + 30
        } 
    }
}

export { Timer }
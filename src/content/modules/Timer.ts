import { 
    Phase, Console, setAttributes, setParent,
    WhiteSettingsBelt, Converter, globalGame, SpeedParameters, speedParameterDefaults, DOMUNLOADINGALLOWANCE, 
    GarticXHRData
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
    required: number = 0
    elapsed: number = 0
    parameters: SpeedParameters = speedParameterDefaults
    decay: number = 0              // used by Timer

    constructor() { // Empty.
        super()
    }  
    // TODO: Elements normally aren't actually destroyed when they're removed from DOM. 
    // Maybe this.display still exists between transitions? If so we can avoid the costly thing.
    // But is it even possible, given that we pluck the clock and stick it in the holder?
    
    mutation(oldPhase: Phase, newPhase: Phase): void {
        if (newPhase == "book") { return }
        setTimeout(this.placeTimer.bind(this), DOMUNLOADINGALLOWANCE)

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        this.clearTimer() 
        setTimeout(this.startTimer.bind(this), DOMUNLOADINGALLOWANCE, newPhase)
    }
    roundStart(): void {
        // const data = dict.custom
        const parameters = Converter.speedStringToParameters(globalGame.speedString)
        this.decay = parameters.decayFunction(globalGame.turns)
        // delete parameters.turns
        Object.assign(this.parameters, parameters)  // TODO: unsafe and unscalable
    }
    patchReconnect(data: GarticXHRData): void {
        if (!data.elapsedBase) { return }
        if (!data.elapsedTime) { return }
        const elapsed = data.timeStarted ? data.elapsedTime : data.elapsedBase
        this.elapsed = Math.ceil(elapsed / 1000)
    }
    roundEnd(): void {} // Empty.
    adjustSettings(previous: string, current: string): void {
        if (this.display == undefined) { return }
        if (current == "on") { this.display.style.visibility = "visible" } else { this.display.style.visibility = "hidden" }
    }

    placeTimer() {  // [T3]
        // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }
        const clock = document.querySelector(".time") 
        if (!clock) { Console.warn("Could not find clock", "Timer"); return }

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
        setAttributes(display, { id: "timer", style: `visibility:${this.isOff() ? "hidden" : "visible"}` })
        setParent(display, timerDisplay)
        this.display = display

        const p = clock.querySelector('p'); if (p) { p.style.visibility = "hidden" }
    }
    clearTimer() {
        this.elapsed = 0
        clearTimeout(this.countdown)
    }
    startTimer(newPhase: Phase) {
        const clock = document.querySelector(".time")
        if (!clock) { Console.warn("Could not find clock", "Timer"); return }

        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if(p) { p.style.visibility = "hidden" } // Prevents clashing with SillyV's extension
            this.tick(Count.Up)
        } else {
            this.required = this.getSecondsForPhase(newPhase)
            if (this.required == 0) {
                this.tick(Count.Up)
            }
            else {
                this.tick(Count.Down)
            }
        }
        // if (game.parameters["timerCurve"] != 0) { 
        this.interpolate(1); 
        // }
    }
    getSecondsForPhase(newPhase: Phase): number {
        Console.log("I think this phase is " + newPhase, 'Timer');

        const step = document.querySelector(".step")
        if (!step) { Console.warn("Could not find turn counter", "Timer"); return -1 }
        if (!(step.textContent)) { Console.warn("Could not read turn counter", "Timer"); return -1 }

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
                Console.warn("Could not determine duration of phase " + newPhase, 'Timer')
                return 0
        }
        return Math.floor(toReturn)
    }
    tick(increaseStep: Count) {
        const display = this.display ?? document.querySelector("#timer")
        if (!display) { Console.warn("Houston we've lost our clock", "Timer"); return }

        const seconds = increaseStep == Count.Down ? (this.required - this.elapsed) : (this.elapsed)
        const h = String(Math.floor(seconds / 3600)) + ":"
        const m = String(Math.floor(seconds / 60)) + ":"
        var s = String(seconds % 60);
        if (s.length < 2) { s = 0 + s }
        display.textContent = h == "0:" ? m + s : h + m + s

        if ((this.required > 0 && seconds <= 0) || !this.display) { Console.log("Countdown ended", 'Timer'); return }
        this.elapsed += 1
        this.countdown = window.setTimeout(this.tick.bind(this), 1000, increaseStep)
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

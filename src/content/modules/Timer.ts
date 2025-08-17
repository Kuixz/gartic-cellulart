import {
  Console,
  WhiteSettingsBelt,
  Phase,
  CellulartEventType,
  GarticXHRData,
  PhaseChangeEvent,
  Converter,
  SpeedParameters,
  speedParameterDefaults,
  DOMUNLOADINGALLOWANCE,
  constructElement,
  formatTime,
} from "../foundation";
import { ModuleArgs, CellulartModule } from "./CellulartModule";

enum Count {
  Up = 1,
  Down = -1,
}

/*  ----------------------------------------------------------------------
 *                                 Timer
 * ---------------------------------------------------------------------- */
/** Timer adds a digital timer displaying time remaining (or elapsed)
 * in the top right corner, just under the analog clock.                  */
export class Timer extends CellulartModule {
  name = "Timer";
  setting = WhiteSettingsBelt(this.name.toLowerCase(), true);

  // Timer variables
  display: HTMLElement; // HTMLDivElement
  countdownID: number | undefined; // timeoutID
  required: number = 0;
  elapsed: number = 0;
  parameters: SpeedParameters = speedParameterDefaults;
  decay: number = 0;

  constructor(moduleArgs: ModuleArgs) {
    super(moduleArgs, [
      CellulartEventType.ENTER_ROUND,
      CellulartEventType.PHASE_CHANGE,
    ]);
    this.display = constructElement({
      type: "div",
      class: "timer-timer",
      style: `visibility:${this.isOff() ? "hidden" : "visible"}`,
    });
  }

  protected onroundenter(): void {
    const parameters = Converter.speedIndexToParameters(
      this.globalGame.speedIndex,
    );
    this.decay = parameters.decayFunction(this.globalGame.turnCount);
    this.parameters = { ...parameters };
  }
  protected onphasechange(event: PhaseChangeEvent): void {
    const { isReconnection, oldPhase, data, newPhase } = event.detail;
    if (newPhase == "book") {
      return;
    }
    this.placeTimer();

    // If we changed from a phase that warrants a reset in the timer, reset the timer.
    if (oldPhase == "memory" && newPhase != "memory") {
      return;
    }
    this.clearTimer();
    this.startTimer(newPhase);

    if (isReconnection) {
      if (!data.elapsedBase) {
        return;
      }
      if (!data.elapsedTime) {
        return;
      }
      const elapsed = data.timeStarted ? data.elapsedTime : data.elapsedBase;
      this.elapsed = Math.ceil(elapsed / 1000);
    }
  }

  public adjustSettings(): void {
    if (this.isOn()) {
      this.display.style.visibility = "visible";
    } else {
      this.display.style.visibility = "hidden";
    }
  }

  private placeTimer() {
    // [T3]
    // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }
    const clock = document.querySelector(".time");
    if (!clock) {
      Console.warn("Could not find clock", "Timer");
      return;
    }

    clock.appendChild(this.display);

    const p = clock.querySelector("p");
    if (p) {
      p.remove();
    }
  }
  private clearTimer() {
    this.elapsed = 0;
    clearTimeout(this.countdownID);
  }
  private startTimer(newPhase: Phase) {
    // console.log(this);
    const clock = document.querySelector(".time");
    if (!clock) {
      Console.warn("Could not find clock", "Timer");
      return;
    }

    if (clock.classList.contains("lock")) {
      const p = clock.querySelector("p");
      if (p) {
        p.style.visibility = "hidden";
      } // Prevents clashing with SillyV's extension
      this.tick(Count.Up);
    } else {
      this.required = this.getSecondsForPhase(newPhase);
      if (this.required == 0) {
        this.tick(Count.Up);
      } else {
        this.tick(Count.Down);
      }
    }
    // if (game.parameters["timerCurve"] != 0) {
    this.interpolate(1);
    // }
  }
  private getSecondsForPhase(newPhase: Phase): number {
    Console.log("I think this phase is " + newPhase, "Timer");

    const step = document.querySelector(".step");
    if (!step) {
      Console.warn("Could not find turn counter", "Timer");
      return -1;
    }
    if (!step.textContent) {
      Console.warn("Could not read turn counter", "Timer");
      return -1;
    }

    let toReturn = 0;
    switch (newPhase) {
      case "draw":
      case "memory":
        // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST

        if (
          step.textContent.slice(0, 2) == "1/" &&
          ![1, 1.25].includes(this.parameters.firstMultiplier)
        ) {
          toReturn = 150 * this.parameters.firstMultiplier; // Bad premature optimization replacing this.draw with flat 150
        } else {
          toReturn = this.parameters.draw;
        }
        break;
      case "write":
        toReturn = this.parameters.write;
        break;
      case "first":
        toReturn = this.parameters.write * this.parameters.firstMultiplier;
        break;
      case "mod":
        return 25; // 10 // [T2]
      default:
        Console.warn(
          "Could not determine duration of phase " + newPhase,
          "Timer",
        );
        return 0;
    }
    return Math.floor(toReturn);
  }
  private tick(increaseStep: Count) {
    const seconds =
      increaseStep == Count.Down ? this.required - this.elapsed : this.elapsed;
    this.display.textContent = formatTime(seconds);

    if ((increaseStep == Count.Down && seconds <= 0) || !this.display) {
      Console.log("Countdown ended", "Timer");
      return;
    }
    this.elapsed += 1;
    this.countdownID = window.setTimeout(
      this.tick.bind(this),
      1000,
      increaseStep,
    );
  }
  private interpolate(times: number) {
    if (this.decay != 0) {
      Console.log("Interpolating regressive/progressive timer", "Timer");
      this.parameters.write =
        (this.parameters.write - 8) * this.decay ** times + 8;
      this.parameters.draw =
        (this.parameters.draw - 30) * this.decay ** times + 30;
    }
  }
}

import { Console, Phase, SettingsBelt, Keybind, DefaultSettings, GarticXHRData, TransitionData } from "../foundation"

abstract class ModuleLike {
    abstract name: string           // All modules have a name property
    abstract setting: SettingsBelt  // All modules have a SettingsBelt
    isCheat: boolean = false        // Most modules declare if they are unfair or not

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    abstract adjustSettings(previous: string, current: string): void

    // menuStep receive messages from the in-window menu and are almost universally shared between modules.
    menuStep() { 
      const c = this.setting.current; 
      const n = this.setting.next(); 
      this.adjustSettings(c.internalName, n.internalName); 
      Console.log(n.internalName, this.name); 
      return n 
    }

    // Syntactic getters for the setting. Shared between modules.
    isSetTo(internalName: string): boolean { return this.setting.isSetTo(internalName) } 
    isOn(): boolean { return this.isSetTo(DefaultSettings.on) }
    isOff(): boolean { return this.isSetTo(DefaultSettings.off) }
    isRed(): boolean { return this.isSetTo(DefaultSettings.red) }
}

/* ----------------------------------------------------------------------
  *                            CellulartModule 
  * ---------------------------------------------------------------------- */
/** CellulartModule outlines methods relating to setting changes
  * and phase changes (with a special case for entering or returning
  * to the lobby), amongst other frameworks to make adding new functionalities
  * easy as pie.
  * ---------------------------------------------------------------------- */
abstract class CellulartModule extends ModuleLike { // [F2]
    keybinds: Keybind[] = []        // Some modules have keybinds

    // Initialization. 
    // To be overridden by each module.
    constructor() { super() }

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    abstract mutation(oldPhase: Phase, transitionData: TransitionData | null, newPhase: Phase): void

    // These functions set critical persistent variables when a game starts.
    // To be overridden by each module.
    enterLobby(): void {}
    roundStart(): void {}
    patchReconnect(data: GarticXHRData): void {}

    // These functions "clean the slate" when a game ends. 
    // To be overridden by each module.
    roundEnd(oldPhase: Phase): void {}
    exitLobby(oldPhase: Phase): void {}

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    abstract adjustSettings(): void

    // togglePlus handles module extensions.
    togglePlus(plus: boolean) { if (plus) { this.setting.extend() } else { this.setting.retract() } }
    // An unstated assumption is that the following is always equal to 0 or 1:
    // the number of times togglePlus(true) is called minus the number of times togglePlus(false) is called.
}

abstract class Metamodule extends ModuleLike {
  constructor(num: CellulartModule[]) { super() }
}

// type AuxChamber = (typeof Auxmodule)[]
type ModuleChamber = (typeof CellulartModule)[]
type MetaChamber = (typeof Metamodule)[]

export { CellulartModule, Metamodule }
export type { /*AuxChamber, */ ModuleChamber, MetaChamber, ModuleLike }

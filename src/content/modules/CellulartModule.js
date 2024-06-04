
import { Console } from '../foundation.js'

/* ----------------------------------------------------------------------
  *                            CellulartModule 
  * ---------------------------------------------------------------------- */
/** CellulartModule outlines methods relating to setting changes
  * and phase changes (with a special case for entering or returning
  * to the lobby), amongst other frameworks to make adding new functionalities
  * easy as pie.
  * ---------------------------------------------------------------------- */
const CellulartModule = { // [F2]
    name : "null",          // All modules have a name property
    hasMenuButton : true,   // Some modules aren't directly controllable
    isCheat : false,        // Most modules declare if they are unfair or not
    setting : undefined,    // All modules have a SettingsBelt
    keybinds : undefined,   // Some modules have keybinds

    // Initialization. 
    // To be overridden by each module.
    init(modules) {},

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    mutation(oldPhase, newPhase) {},

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    backToLobby(oldPhase) {}, 

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous, current) {},

    // This function should set internal states based on the game config
    // depending on the needs of the module.
    // To be overridden by each module that requires more than marginal state knowledge.
    update42(type, data) {},

    // These functions receive messages from the in-window menu and are generally shared between modules.
    menuStep() { const c = this.setting.current(); const n = this.setting.next(); this.adjustSettings(c,n); Console.log(n, this.name); return n },
    togglePlus(plus) { if (plus) { this.setting.extend() } else { this.setting.retract() } },
    // current() { return this.setting.current() }
    // An unstated assumption is that the following is always equal to 0 or 1:
    // the number of times togglePlus(true) is called minus the number of times togglePlus(false) is called.
}

export default CellulartModule
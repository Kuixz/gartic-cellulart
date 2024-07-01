// import { Socket, preventDefaults, clamp, gifenc, WhiteSettingsBelt, RedSettingsBelt, SettingsBelt, Console, Inwindow, setAttributes, svgNS, getResource, Converter, Keybind } from 'bleh'
// import Console from "./Console";
// import Console from "../foundation/Console.js";
import { Console } from "../foundation";

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

    // This function sets critical persistent variables when a game starts.
    // To be overridden by each module.
    roundStart() {},

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    // TODO: Remove oldPhase from this.
    backToLobby(oldPhase) {}, 

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous, current) {},

    // These three functions handle the retrieval of settings between sessions.
    // Long term storage: recurrent
    // Short term storage: transient
    // saveRecurrentState() { return {} },
    // saveTransientState() { return {} },
    // saveRecurrentState() { Shelf.set({ [this.name + '_recurrent_state']: {} }) },
    // saveTransientState() { Shelf.set({ [this.name + '_transient_state']: {} }) },



    //  Loading from storage (this function is generally shared between modules):
    // loadState() {
    //     const dict = {}
    //     Object.assign(this, dict)
    //     // if ('recurrent' in dict) {
    //     //     // if ('setting' in dict.recurrent) {
    //     //     //    this.setting.jump(dict.recurrent.setting)
    //     //     //    delete dict.recurrent.setting
    //     //     // }
    //     //     Object.assign(this, dict.recurrent)
    //     // }
    //     // if ('transient' in dict) {
    //     //     Object.assign(this, dict.transient)
    //     // }
    // },
    // loadState(dict, transient) {
    //     if (!(this.name in dict)) { return }
    //     const data = dict[this.name]
    //     // if ('recurrent' in dict) {
    //     //     // if ('setting' in dict.recurrent) {
    //     //     //    this.setting.jump(dict.recurrent.setting)
    //     //     //    delete dict.recurrent.setting
    //     //     // }
    //     //     Object.assign(this, dict.recurrent)
    //     // }
    //     // if (transient && 'transient' in dict) {
    //     //     Object.assign(this, dict.transient)
    //     // }
    // },
    // loadTransientState() {

    // }

    // Syntactic getter for the setting. Generally shared between modules.
    isSetTo(thing) { return this.setting.current == thing }, // TODO: bad coupling
    // isSetTo(thing) { return this.setting.isSetTo(thing) },

    // These functions receive messages from the in-window menu and are generally shared between modules.
    menuStep() { const c = this.setting.current; const n = this.setting.next(); this.adjustSettings(c.name,n.name); Console.log(n, this.name); return n },
    togglePlus(plus) { if (plus) { this.setting.extend() } else { this.setting.retract() } },
    // current() { return this.setting.current }
    // An unstated assumption is that the following is always equal to 0 or 1:
    // the number of times togglePlus(true) is called minus the number of times togglePlus(false) is called.
}
export default CellulartModule
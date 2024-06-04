
import CellulartModule from "./CellulartModule";
import { SettingsBelt } from "../foundation.js"

/* ----------------------------------------------------------------------
 *                              Triangle (WIP)
 * ---------------------------------------------------------------------- */
/** Triangles (full with T, outlined with K).
  * Possibly opens the door to a third generation of autodrawers.
  * (WIP) This module is not initialized by Controller.
  * ---------------------------------------------------------------------- */
const Triangle = {
    name: "Triangle", // All modules have a name property
    setting: new SettingsBelt(['isoceles', '3point']), // All modules have a SettingsBelt






    // keybinds : [
    //     new Keybind((e) => e.code == "T" , (e) => { Triangle.beginDrawingFullTriangle() }),
    //     new Keybind((e) => e.code == "K" , (e) => { Triangle.beginDrawingFrameTriangle() }),
    //             ],
    // previewCanvas : undefined, 
    init(modules) { }, // Probably empty.
    mutation(oldPhase, newPhase) {
        // Probably, we should discard the preview canvas (let it get removed from DOM),
        // and reinitialize it on every new drawing phase.
    },
    backToLobby(oldPhase) { }, // Probably empty.
    adjustSettings(previous, current) {
        switch (current) {
            case 'isoceles': break;
            // 
            case '3point': break;
            // 
        }
        // Isoceles and 3-point have entirely different control schemes.
    },
    // update42(type, data) {},
    beginDrawingFullTriangle() {
    },
    beginDrawingFrameTriangle() {
    },
    deselect() {
        // I need to carefully juggle variables to yield the correct behaviour when deselecting.
    },
    // Snowball 2, 6, 10, 14, 18
};
Object.setPrototypeOf(Triangle, CellulartModule)

export default Triangle


// #endregion


// console.log(Object.keys(window))
// if (typeof exports !== 'undefined') {
    // module.exports = { Debug, Red, Timer, Koss, Refdrop, Spotlight, Geom, Triangle, Reveal, Scry };
// }
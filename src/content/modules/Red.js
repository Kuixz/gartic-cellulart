
import { SettingsBelt } from '../foundation.js'
import CellulartModule from './CellulartModule.js';

/* ----------------------------------------------------------------------
  *                                  Red
  * ---------------------------------------------------------------------- */
/** Red controls the "cheat activation" status of the other modules.
  * A plain and simple 10-line minimodule that
  * barely adds anything of its own to the CellulartModule framework.
  * ---------------------------------------------------------------------- */
const Red = {
    name: "Red",
    isCheat: true,
    setting: new SettingsBelt(['on', 'red']),

    modules: null,

    init(modules) {
        this.modules = modules.filter((x) => 'setting' in x);
        // console.log(this.modules)
    },
    adjustSettings(previous, current) {
        this.modules.forEach((mod) => { mod.togglePlus(current == 'red'); });
    }
};
Object.setPrototypeOf(Red, CellulartModule)

export default Red
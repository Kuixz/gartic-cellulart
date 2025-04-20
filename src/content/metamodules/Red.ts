import { SettingsBeltFrom } from "../foundation";
import { Metamodule, CellulartModule } from "../modules";

/* ----------------------------------------------------------------------
  *                                  Red 
  * ---------------------------------------------------------------------- */
/** Red controls the "cheat activation" status of the other modules.
  * A plain and simple 10-line minimodule that 
  * barely adds anything of its own to the CellulartModule framework.
  * ---------------------------------------------------------------------- */
class Red extends Metamodule {
    name = "Red"
    isCheat = true
    setting = SettingsBeltFrom(this.name.toLowerCase(), ['on', 'red'], 0)

    modules: CellulartModule[]

    constructor(modules: CellulartModule[]) {
        super(modules)

        this.modules = modules.filter((x) => 'setting' in x ) 
        // console.log(this.modules)
    }
    adjustSettings() {
        this.modules.forEach((mod) => { mod.togglePlus(this.isRed()) })
    }
}

export { Red }

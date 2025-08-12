
import { RedSettingsBelt } from "../foundation";
import { CellulartModule, ModuleArgs } from "./CellulartModule";

 /* ----------------------------------------------------------------------
  *                                 Akasha 
  * ----------------------------------------------------------------------
  *                          Suggested by Daniel
  * ----------------------------------------------------------------------  */
/** There will be nothing new under the sun (coming from your client) 
  * if you use Akasha to save and carbon copy incoming drawings back out. 
  * Takes a while to send all its strokes, just like Geom.                  */
export class Akasha extends CellulartModule {
  public name = "Akasha";
  public setting = RedSettingsBelt(this.name)
  public isCheat = true
}


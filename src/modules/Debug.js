import { 
    WhiteSettingsBelt,
    Console,
    Inwindow,
    setAttributes
} from "../foundation";
import CellulartModule from "./CellulartModule";

/* ----------------------------------------------------------------------
  *                                 Debug 
  * ---------------------------------------------------------------------- */
/** Debug routes or blocks console messages.
  * Works closely with Console; the two should be merged into one.
  * ---------------------------------------------------------------------- */
const Debug = {
    name : "Debug",
    setting : new WhiteSettingsBelt(),    

    debugWIW : undefined,

    init(modules) {
        const debugWIW = Inwindow.new(false, false, 0.2)
        const body = setAttributes(debugWIW.body, { id:"debug-body" });
        const iconSelect = setAttributes(document.createElement("div"), { id: 'debug-header', parent: body })

        // const preactivated = [ Observer ]
        modules.map(mod => mod.name).concat(["Socket", "Xhr", "Worker", "Observer"]).forEach((mod) => {
            const modIcon = setAttributes(document.createElement("img"), { class: "cellulart-circular-icon", src: mod.setting.current.asset,/*getResource("assets/menu-icons/" + mod.toLowerCase() + "_on" + ".png"),*/ parent: iconSelect })
            modIcon.addEventListener("click", toggle)
            if (Console.enabled.has(mod)) { 
                modIcon.classList.add("debug-selected")
            }
            function toggle() {
                modIcon.classList.toggle("debug-selected")
                Console.toggle(mod)
            }
        }) 

        Debug.debugWIW = debugWIW;
    },
    adjustSettings(previous, current) {
        if (current == 'on') { 
            Debug.debugWIW.setVisibility('initial'); return 
        }
        Debug.debugWIW.setVisibility('hidden')
    },
}; 
Object.setPrototypeOf(Debug, CellulartModule)

export default Debug
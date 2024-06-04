
import CellulartModule from "./CellulartModule";
import * as menu_icons from "./menu-icons/index.js"
import { 
    // Socket, Xhr, 
    Console,
    WhiteSettingsBelt, 
    Inwindow, 
    setAttributes
} from "../foundation.js"

/* ----------------------------------------------------------------------
  *                                 Debug
  * ---------------------------------------------------------------------- */
/** Debug routes or blocks console messages.
  * Works closely with Console; the two should be merged into one.
  * ---------------------------------------------------------------------- */
const Debug = {
    name: "Debug",
    setting: new WhiteSettingsBelt(),

    debugWIW: undefined,

    init(modules) {
        const debugWIW = Inwindow.new(false, false, 0.2);
        const body = setAttributes(debugWIW.body, { id: "debug-body" });
        const iconSelect = setAttributes(document.createElement("div"), { id: 'debug-header', parent: body });

        // const preactivated = [ Observer ]
        modules.concat([{ name: "Socket" }, { name: "Xhr" }, { name: "Worker" }, { name: "Observer" }]).forEach((mod) => {
            const modIcon = setAttributes(document.createElement("img"), { class: "cellulart-circular-icon", src: menu_icons[mod.name.toLowerCase() + "_on" + ".png"], parent: iconSelect });
            modIcon.addEventListener("click", toggle);
            if (Console.enabled.has(mod.name)) {
                modIcon.classList.add("debug-selected");
            }
            function toggle() {
                modIcon.classList.toggle("debug-selected");
                Console.toggle(mod.name);
            }
        });

        Debug.debugWIW = debugWIW;
    },
    adjustSettings(previous, current) {
        if (current == 'on') {
            Debug.debugWIW.setVisibility('initial'); return;
        }
        Debug.debugWIW.setVisibility('hidden');
    },
};
Object.setPrototypeOf(Debug, CellulartModule)

export default Debug
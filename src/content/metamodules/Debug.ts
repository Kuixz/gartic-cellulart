import { WhiteSettingsBelt, Inwindow, Console, setAttributes, getMenuIcon, setParent, DefaultSettings } from "../foundation";
import { CellulartModule, Metamodule } from "../modules";

/* ----------------------------------------------------------------------
  *                                 Debug 
  * ---------------------------------------------------------------------- */
/** Debug routes or blocks console messages.
  * Works closely with Console; the two should be merged into one.
  * ---------------------------------------------------------------------- */
class Debug extends Metamodule {
    name = "Debug"
    setting = WhiteSettingsBelt(this.name.toLowerCase())   

    debugWIW : Inwindow

    constructor(modules: CellulartModule[]) {
        super(modules)

        const debugWIW = new Inwindow("default", { visible:false, close:false, ratio:0.2, maxGrowFactor: 2 })
        debugWIW.body.classList.add("debug-body");
        const iconSelect = document.createElement("div")
        iconSelect.classList.add('debug-scroll-window')
        setParent(iconSelect, debugWIW.body)

        // const preactivated = [ Observer ]
        modules.map(mod => mod.name).concat(["Socket", "Xhr", "Worker", "Observer"]).forEach((mod) => {
            const modIcon = document.createElement("img")
            setAttributes(modIcon, { class: "cellulart-circular-icon", src: getMenuIcon(mod.toLowerCase() + "-on" + ".png") })
            setParent(modIcon, iconSelect)
            modIcon.addEventListener("click", toggle)
            if (Console.enabledLoggingFor.has(mod)) { 
                modIcon.classList.add("debug-selected")
            }
            
            function toggle() {
                modIcon.classList.toggle("debug-selected")
                Console.toggle(mod)
            }
        }) 

        this.debugWIW = debugWIW;
    }
    adjustSettings(previous: string, current: string) {
        this.debugWIW.setVisibility(current == DefaultSettings.on)
    }

    // TODO: Hide Red modules while not authenticated.
}

export { Debug }

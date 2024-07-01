import CellulartModule from "./CellulartModule.js";
import { 
    RedSettingsBelt,
    Console,
    Inwindow,
    setAttributes
} from "../foundation";

 /* ----------------------------------------------------------------------
  *                                  Koss 
  * ---------------------------------------------------------------------- */
/** Knock-Off Screenshot (Koss), self-explanatory:
  * automatically takes a screenshot of the image you're supposed to 
  * memorize. The lightest module, being only 70 lines long.                    
  * ---------------------------------------------------------------------- */
const Koss = { // [K1]

    name : "Koss",
    isCheat : true,
    setting : new RedSettingsBelt(),
    // KOSS variables
    kossWIW : undefined,    // HTMLDivElement
    kossImage : undefined,  // HTMLImageElement
    kossCanvas : undefined, // HTMLCanvasElement

    init(modules) {
        this.kossWIW = Inwindow.new(false, false);
        this.kossWIW.body.style.position = 'relative';  // TODO: Too many dots
        this.kossImage = setAttributes(new Image(), { style: "position: absolute", class:"wiw-img" })
    },
    mutation(oldPhase, newPhase) { 
        // ssView.childNodes[1].appendChild(kossImage);
        const wiwBody = this.kossWIW.body
        if (wiwBody.firstChild) { wiwBody.removeChild(wiwBody.firstChild) }
        if (newPhase == 'memory') {
            setTimeout(() => { this.kossCanvas = document.querySelector(".core").querySelector("canvas") }, 10)
        }
        else if (newPhase == 'draw') {
            // document.querySelector(".core").querySelector("canvas")
            // this.kossCanvas
            this.placeCanvas()
        }
        // If the new phase is "memory", schedule a screenshot to be taken of the canvas approximately when it's done drawing.
        // if (newPhase == "memory") {
        //     // Recover the kossImage from the overlay position so that we don't lose track of it.
        //     this.kossWIW.querySelector(".wiw-body").appendChild(this.kossImage);
        //     setTimeout(this.screenshot, 1500);
        // } else if (newPhase == "draw" && this.setting.current == 'red') {
        //     setTimeout(this.tryUnderlayKossImage, 1000)
        // }
    },
    backToLobby(oldPhase) {
        // this.kossImage.src = "";
        if (this.kossCanvas) {
            this.kossCanvas.remove();
            this.kossCanvas = undefined;
        }
    },
    adjustSettings(previous, current) {
        // alert(current)
        switch (current) {
            case 'off':
                this.kossWIW.setVisibility("hidden");
                if (this.kossCanvas) { this.kossWIW.body.appendChild(this.kossCanvas); }
                break;
            case 'on':
                this.kossWIW.setVisibility("visible");
                if (this.kossCanvas) { 
                    this.kossCanvas.style.opacity = "1"; 
                    this.kossWIW.body.appendChild(this.kossCanvas); 
                }
                break;
            case 'red':
                this.kossWIW.setVisibility("visible");
                if (this.kossCanvas) { 
                    this.kossCanvas.style.opacity = "0.25"; 
                    this.tryUnderlayKossImage();
                }
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    },

    placeCanvas() {
        if (!this.kossCanvas) { return }
       /* if (this.kossCanvas) { */ this.kossCanvas.classList.add('koss-canvas') // }
        switch (this.setting.current) {
            case 'off':
                this.kossWIW.body.appendChild(this.kossCanvas);
                break;
            case 'on':
                this.kossWIW.body.appendChild(this.kossCanvas);
                break;
            case 'red':
                setTimeout(() => { this.tryUnderlayKossImage() }, 1000);
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    },
    tryUnderlayKossImage() {
        this.kossCanvas.style.opacity = "0.25";
        try { 
            document.querySelector(".drawingContainer").insertAdjacentElement("beforebegin", this.kossCanvas);
            Console.log("Koss image underlaid", 'Koss')
        } catch {
            Console.log("Koss image NOT underlaid, no place found : not on draw mode?", 'Koss')
        }
    },
}
Object.setPrototypeOf(Koss, CellulartModule)

export default Koss
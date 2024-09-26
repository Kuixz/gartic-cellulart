import { CellulartModule } from "./CellulartModule";
import { Console, DefaultSettings, DOMLOADINGALLOWANCE, globalGame, Inwindow, Phase, RedSettingsBelt, setAttributes } from "../foundation";

 /* ----------------------------------------------------------------------
  *                                  Koss 
  * ---------------------------------------------------------------------- */
/** Knock-Off Screenshot (Koss), self-explanatory:
  * automatically takes a screenshot of the image you're supposed to 
  * memorize. The lightest module, being only 70 lines long.                    
  * ---------------------------------------------------------------------- */
class Koss extends CellulartModule { // [K1]
    name = "Koss"
    isCheat = true
    setting = RedSettingsBelt(this.name.toLowerCase())
    // KOSS variables
    kossInwindow: Inwindow    // HTMLDivElement
    kossImage: HTMLElement    // HTMLImageElement
    kossCanvas: HTMLElement | undefined   // HTMLCanvasElement

    constructor() {
        super()

        const inwindow = new Inwindow("default", { close: false, ratio:"default" })
        inwindow.body.style.position = 'relative';  // TODO: Too many dots
        this.kossInwindow = inwindow;

        const image = new Image()
        setAttributes(image, { style: "position: absolute", class:"wiw-img" })
        this.kossImage = image
    }
    mutation(oldPhase: Phase, newPhase: Phase) { 
        // ssView.childNodes[1].appendChild(kossImage);
        const wiwBody = this.kossInwindow.body
        
        if (wiwBody.firstChild) { wiwBody.removeChild(wiwBody.firstChild) }
        if (newPhase == "memory") {
            this.discardCanvas()
            setTimeout(() => { 
                this.kossCanvas = document.querySelector(".core canvas")! as HTMLCanvasElement
            }, DOMLOADINGALLOWANCE)
            return
        }
        this.tryPlace()
    }
    roundStart() {}
    roundEnd() {
        // this.kossImage.src = "";
        this.discardCanvas()
    }
    exitLobby(oldPhase: Phase): void {
        this.discardCanvas()
    }
    adjustSettings(previous: string, current: string) {
        // alert(current)
        if (this.isOff()) {
            this.kossInwindow.setVisibility(false);
        } else if (this.isOn()) {
            this.kossInwindow.setVisibility(true);
        } else if (this.isRed()) {
            this.kossInwindow.setVisibility(false);
        }

        this.tryPlace()
    }

    canPlace(): boolean {
        return globalGame.currentPhase == "draw"
    }
    tryPlace() {
        if (!this.canPlace()) { return }
        if (!this.kossCanvas) { return }

        if (this.isOff()) {
            this.kossCanvas.classList.add('koss-canvas')
            this.kossCanvas.style.opacity = "1"; 
            this.kossInwindow.body.appendChild(this.kossCanvas);
        } else if (this.isOn()) {
            this.kossCanvas.classList.add('koss-canvas')
            this.kossCanvas.style.opacity = "1"; 
            this.kossInwindow.body.appendChild(this.kossCanvas); 
        } else if (this.isRed()) {
            this.kossCanvas.classList.add('koss-canvas')
            this.kossCanvas.style.opacity = "0.25";
            const drawingContainer = document.querySelector(".drawingContainer")
            if (!drawingContainer) {
                Console.warn("Cannot underlay canvas: cannot find active drawing canvas", "Koss")
                return 
            }
            drawingContainer.insertAdjacentElement("beforebegin", this.kossCanvas);
            Console.log("Koss image underlaid", 'Koss')
        }
    }
    discardCanvas() {
        if (!this.kossCanvas) { return }
        this.kossCanvas.remove();
        this.kossCanvas = undefined;
    }
}

// const KossInstance = new Koss()

export { Koss }

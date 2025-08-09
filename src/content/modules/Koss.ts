import { CellulartModule } from "./CellulartModule";
import { 
    Console, 
    RedSettingsBelt, 
    BaseGame, CellulartEventType, PhaseChangeEvent, 
    DEFAULTINWINDOWRATIO, DOMLOADINGALLOWANCE, Inwindow, 
    constructElement
} from "../foundation";

 /* ----------------------------------------------------------------------
  *                                  Koss 
  * ---------------------------------------------------------------------- */
/** Knock-Off Screenshot (Koss), self-explanatory:
  * automatically takes a screenshot of the image you're supposed to 
  * memorize. The lightest module, being only 70 lines long.               */
export class Koss extends CellulartModule { // [K1]
    name = "Koss"
    setting = RedSettingsBelt(this.name.toLowerCase())
    // KOSS variables
    kossInwindow: Inwindow    // HTMLDivElement
    kossImage: HTMLElement    // HTMLImageElement
    kossCanvas: HTMLElement | undefined   // HTMLCanvasElement

    constructor(globalGame: BaseGame) {
        super(globalGame, [
            CellulartEventType.PHASE_CHANGE,
            CellulartEventType.LEAVE_ROUND
        ])

        const inwindow = new Inwindow("default", { close: false, ratio: DEFAULTINWINDOWRATIO })
        inwindow.body.style.position = 'relative';  // TODO: Too many dots
        this.kossInwindow = inwindow;

        this.kossImage = constructElement({
            type: 'img',
            class: 'wiw-img',
            style: 'position: absolute',
        })
    }

    protected onphasechange(event: PhaseChangeEvent): void {
        const { newPhase } = event.detail
        const wiwBody = this.kossInwindow.body
        
        wiwBody.firstChild?.remove()
        if (newPhase == "memory") {
            this.discardCanvas()
            setTimeout(() => { 
                this.kossCanvas = document.querySelector(".core canvas")! as HTMLCanvasElement
            }, DOMLOADINGALLOWANCE)
            return
        }
        this.tryPlace()
    }
    protected onroundleave() {
        // this.kossImage.src = "";
        this.discardCanvas()
    }

    public adjustSettings() {
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

    private canPlace(): boolean {
        return this.globalGame.currentPhase == "draw"
    }
    private tryPlace() {
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
    private discardCanvas() {
        if (!this.kossCanvas) { return }
        this.kossCanvas.remove();
        this.kossCanvas = undefined;
    }
}

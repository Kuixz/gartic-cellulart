import { CellulartModule } from "./CellulartModule";
import { Console, DOMLOADINGALLOWANCE, Inwindow, Phase, RedSettingsBelt, setAttributes } from "../foundation";

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
    kossCanvasLock: boolean = false

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
        const wiwBody = this.kossInwindow?.body
        if (!wiwBody) { Console.alert("Inwindow has no body", "Koss"); return }
        
        if (wiwBody.firstChild) { wiwBody.removeChild(wiwBody.firstChild) }
        if (newPhase == 'memory') {
            this.kossCanvasLock = true
            this.discardCanvas()
            setTimeout(() => { 
                this.kossCanvas = document.querySelector(".core canvas")! as HTMLCanvasElement
            }, DOMLOADINGALLOWANCE)
        }
        else if (newPhase == 'draw') {
            this.kossCanvasLock = false
            // document.querySelector(".core").querySelector("canvas")
            // this.kossCanvas
            this.placeCanvas()
        }
    }
    roundStart() {}
    roundEnd() {
        // this.kossImage.src = "";
        this.discardCanvas()
    }
    adjustSettings(previous: string, current: string) {
        // alert(current)
        switch (current) {
            case 'off':
                this.kossInwindow.setVisibility("hidden");
                break;
            case 'on':
                this.kossInwindow.setVisibility("visible");
                break;
            case 'red':
                this.kossInwindow.setVisibility("hidden");
                break;
            default: Console.alert("KOSS setting not recognised", 'Koss')
        }
        this.placeCanvas()
    }

    placeCanvas() {
        if (!this.kossCanvas) { 
            Console.alert("Cannot place canvas: no canvas", "Koss")
            return 
        }
        if (this.kossCanvasLock) { 
            Console.alert("Cannot place canvas: locked", "Koss")
            return 
        }

        this.kossCanvas.classList.add('koss-canvas')
        switch (this.setting.current.internalName) {
            case 'off':
                this.placeOffCanvas()
                break;
            case 'on':
                this.placeOnCanvas()
                break;
            case 'red':
                this.placeRedCanvas()
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    //     if (!this.kossCanvas) { return }
    //    /* if (this.kossCanvas) { */ this.kossCanvas.classList.add('koss-canvas') // }
    //     if (this.isSetTo('off')) {
    //         this.kossInwindow.body.appendChild(this.kossCanvas);
    //     } else if (this.isSetTo('on')) {
    //         this.kossInwindow.body.appendChild(this.kossCanvas);
    //     } else if (this.isSetTo('red')) {
    //         setTimeout(() => { this.tryUnderlayKossImage() }, 1000);
    //     } else {
    //         Console.alert("KOSS location not recognised", 'Koss')
    //     }
    }
    placeOffCanvas() {
        this.kossInwindow.setVisibility("hidden");
    
        if (!this.kossCanvas) { return }
        this.kossCanvas.style.opacity = "1"; 
        this.kossInwindow.body.appendChild(this.kossCanvas);
    }
    placeOnCanvas() {
        this.kossInwindow.setVisibility("visible");

        if (!this.kossCanvas) { return }
        this.kossCanvas.style.opacity = "1"; 
        this.kossInwindow.body.appendChild(this.kossCanvas); 
    }
    placeRedCanvas() {
        this.kossInwindow.setVisibility("hidden");

        if (!this.kossCanvas) { return }
        this.kossCanvas.style.opacity = "0.25";
        const drawingContainer = document.querySelector(".drawingContainer")
        if (!drawingContainer) {
            Console.alert("Cannot underlay canvas: cannot find active drawing canvas", "Koss")
            return 
        }
        drawingContainer.insertAdjacentElement("beforebegin", this.kossCanvas);
        Console.log("Koss image underlaid", 'Koss')
    }
    discardCanvas() {
        if (!this.kossCanvas) { return }
        this.kossCanvas.remove();
        this.kossCanvas = undefined;
    }
}

// const KossInstance = new Koss()

export { Koss }
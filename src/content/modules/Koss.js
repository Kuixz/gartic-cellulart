
import CellulartModule from "./CellulartModule";
import { 
    Console,
    Inwindow, 
    RedSettingsBelt,
    setAttributes
} from "../foundation.js"

/* ----------------------------------------------------------------------
 *                                  Koss
 * ---------------------------------------------------------------------- */
/** Knock-Off Screenshot (Koss), self-explanatory:
  * automatically takes a screenshot of the image you're supposed to
  * memorize. The lightest module, being only 70 lines long.
  * ---------------------------------------------------------------------- */
const Koss = {
    name: "Koss",
    isCheat: true,
    setting: new RedSettingsBelt(),
    // KOSS variables
    kossWIW: undefined, // HTMLDivElement
    kossImage: undefined, // HTMLImageElement
    kossCanvas: undefined, // HTMLCanvasElement

    init(modules) {
        Koss.kossWIW = Inwindow.new(false, false);
        Koss.kossWIW.body.style.position = 'relative'; // TODO: Too many dots
        Koss.kossImage = setAttributes(new Image(), { style: "position: absolute", class: "wiw-img" });
    },
    mutation(oldPhase, newPhase) {
        // ssView.childNodes[1].appendChild(kossImage);
        const wiwBody = Koss.kossWIW.body;
        if (wiwBody.firstChild) { wiwBody.removeChild(wiwBody.firstChild); }
        if (newPhase == 'memory') {
            setTimeout(() => { Koss.kossCanvas = document.querySelector(".core").querySelector("canvas"); }, 10);
        }
        else if (newPhase == 'draw') {
            // document.querySelector(".core").querySelector("canvas")
            // Koss.kossCanvas
            Koss.placeCanvas();
        }
        // If the new phase is "memory", schedule a screenshot to be taken of the canvas approximately when it's done drawing.
        // if (newPhase == "memory") {
        //     // Recover the kossImage from the overlay position so that we don't lose track of it.
        //     Koss.kossWIW.querySelector(".wiw-body").appendChild(Koss.kossImage);
        //     setTimeout(Koss.screenshot, 1500);
        // } else if (newPhase == "draw" && Koss.setting.current() == 'red') {
        //     setTimeout(Koss.tryUnderlayKossImage, 1000)
        // }
    },
    backToLobby(oldPhase) {
        // Koss.kossImage.src = "";
        if (Koss.kossCanvas) {
            Koss.kossCanvas.remove();
            Koss.kossCanvas = undefined;
        }
    },
    adjustSettings(previous, current) {
        // alert(current)
        switch (current) {
            case 'off':
                Koss.kossWIW.setVisibility("hidden");
                if (Koss.kossCanvas) { Koss.kossWIW.body.appendChild(Koss.kossCanvas); }
                break;
            case 'on':
                Koss.kossWIW.setVisibility("visible");
                if (Koss.kossCanvas) {
                    Koss.kossCanvas.style.opacity = "1";
                    Koss.kossWIW.body.appendChild(Koss.kossCanvas);
                }
                break;
            case 'red':
                Koss.kossWIW.setVisibility("visible");
                if (Koss.kossCanvas) {
                    Koss.kossCanvas.style.opacity = "0.25";
                    Koss.tryUnderlayKossImage();
                }
                break;
            default: Console.alert("KOSS location not recognised", 'Koss');
        }
    },
    // update42(type, data) {},
    placeCanvas() {
        if (!Koss.kossCanvas) { return; }
        /* if (Koss.kossCanvas) { */ Koss.kossCanvas.classList.add('koss-canvas'); // }
        switch (Koss.setting.current()) {
            case 'off':
                Koss.kossWIW.body.appendChild(Koss.kossCanvas);
                break;
            case 'on':
                Koss.kossWIW.body.appendChild(Koss.kossCanvas);
                break;
            case 'red':
                setTimeout(Koss.tryUnderlayKossImage, 1000);
                break;
            default: Console.alert("KOSS location not recognised", 'Koss');
        }
    },
    tryUnderlayKossImage() {
        Koss.kossCanvas.style.opacity = "0.25";
        try {
            document.querySelector(".drawingContainer").insertAdjacentElement("beforebegin", Koss.kossCanvas);
            Console.log("Koss image underlaid", 'Koss');
        } catch {
            Console.log("Koss image NOT underlaid, no place found : not on draw mode?", 'Koss');
        }
    },
};
Object.setPrototypeOf(Koss, CellulartModule)

export default Koss
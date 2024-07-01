import CellulartModule from './CellulartModule.js'
import { RedSettingsBelt } from '../foundation';

 /* ----------------------------------------------------------------------
  *                               Reveal (WIP)
  * ---------------------------------------------------------------------- */
/** Reveal uncovers the secrets of the Secret mode. Considered a "cheat". 
  * Current implementation requires invasive XHR patching 
  * and can't be turned off, so I'm working on a softer one.
  * (WIP) This module is not initialized by Controller.
  * ---------------------------------------------------------------------- */
const Reveal = {

    name : "Reveal",
    isCheat : true,
    setting : new RedSettingsBelt('off'), // SettingsBelt(["OFF", "TEXT"], 0, "ALL"), // [V2]

    hiddenElements : undefined,

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (this.isSetTo("OFF")) { return; }
        if (newPhase == "write" || newPhase == "first") {
            this.revealPrompt()
        } else if (this.itSetTo("ALL") && newPhase == "draw") {
            this.revealDrawing()
        }
    },
    /*
    // (deprecated) This function receives messages from the popup
    recieveMessage(message) {}

    // (deprecated) This function asks the module what message it would like to pass to the popup
    getMessage() {} */
    // backToLobby() {} // Empty.
    // These functions receive messages from the in-window menu
    adjustSettings(previous, current) {
        switch (current) {
            case "OFF": this.rehide(); break;
            case "TEXT": this.revealPrompt(); break;
            case "ALL": this.revealDrawing(); break;
        }
    },

    revealPrompt() {
        // TODO: Can't I use an enable/disable CSS or CSS variable thing instead?
        this.hiddenElements = document.querySelector(".center").querySelectorAll(".hiddenMode")
        this.hiddenElements.forEach(n => n.style.cssText = "font-family:Bold; -webkit-text-security: none")
    },
    revealDrawing() {
        // this.hiddenCanvases = document.querySelector(".drawingContainer").querySelectorAll("canvas");
        // this.hiddenCanvases[1].addEventListener("mouseup", () => {
        //     const newwiw = Inwindow.new(true, true);
        //     setAttributes(new Image(), { class: "wiw-img", parent: newwiw.body, src: this.hiddenCanvases[0].toDataURL() })
        // })
        // [V3]
    },
    rehide() {
        this.hiddenElements.forEach(n => n.style.cssText = "");
        // [V3]
    }

    // animate the black cover lifting to gray [V3]
}
Object.setPrototypeOf(Reveal, CellulartModule)


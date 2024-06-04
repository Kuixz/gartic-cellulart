
import CellulartModule from "./CellulartModule";
import {
    // Inwindow,
    RedSettingsBelt,
    // setAttributes
} from '../foundation.js'

/* ----------------------------------------------------------------------
 *                               Reveal (WIP)
 * ---------------------------------------------------------------------- */
/** Reveal uncovers the secrets of the Secret mode. Considered a "cheat".
  * Current implementation requires invasive XHR patching
  * and can't be turned off, so I'm working on a softer one.
  * (WIP) This module is not initialized by Controller.
  * ---------------------------------------------------------------------- */
const Reveal = {
    name: "Reveal",
    isCheat: true,
    setting: new RedSettingsBelt('off'), // SettingsBelt(["OFF", "TEXT"], 0, "ALL"), // [V2]

    hiddenElements: undefined,

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (Reveal.setting.current() == "OFF") { return; }
        if (newPhase == "write" || newPhase == "first") {
            Reveal.revealPrompt();
        } else if (Reveal.setting.current() == "ALL" && newPhase == "draw") {
            Reveal.revealDrawing();
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
            case "OFF": Reveal.rehide(); break;
            case "TEXT": Reveal.revealPrompt(); break;
            case "ALL": Reveal.revealDrawing(); break;
        }
    },
    // update42(type, data) {},
    revealPrompt() {
        Reveal.hiddenElements = document.querySelector(".center").querySelectorAll(".hiddenMode");
        Reveal.hiddenElements.forEach(n => n.style.cssText = "font-family:Bold; -webkit-text-security: none");
    },
    revealDrawing() {
        Reveal.hiddenCanvases = document.querySelector(".drawingContainer").querySelectorAll("canvas");
        // Reveal.hiddenCanvases[1].addEventListener("mouseup", e => {
        //     const newwiw = Inwindow.new(true, true);
        //     setAttributes(new Image(), { class: "wiw-img", parent: newwiw.body, src: Reveal.hiddenCanvases[0].toDataURL() });
        // });
        // [V3]
    },
    rehide() {
        Reveal.hiddenElements.forEach(n => n.style.cssText = "");
        // [V3]
    }
    // animate the black cover lifting to gray [V3]
};
Object.setPrototypeOf(Reveal, CellulartModule)

export default Reveal
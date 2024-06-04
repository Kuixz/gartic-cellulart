
import CellulartModule from "./CellulartModule";
import { ref_ss, ref_ul } from "./module-assets"
import {
    Console,
    Inwindow,
    RedSettingsBelt,
    Keybind,
    clamp, preventDefaults, setAttributes
} from '../foundation.js'

/* ----------------------------------------------------------------------
 *                                 Refdrop
 * ---------------------------------------------------------------------- */
/** Refdrop allows you to upload reference images over or behind the canvas,
  * with controls for position and opacity.
  * Includes arrow key keybinds for adjustment of the image when in Red mode.
  * ---------------------------------------------------------------------- */
const Refdrop = {
    name: "Refdrop",
    setting: new RedSettingsBelt('on'),
    keybinds: [
        new Keybind((e) => e.code == "ArrowLeft", (e) => { Refdrop.refImage.style.left = parseInt(Refdrop.refImage.style.left) - e.shiftKey ? 0.5 : 2 + "px"; }),
        new Keybind((e) => e.code == "ArrowUp", (e) => { Refdrop.refImage.style.top = parseInt(Refdrop.refImage.style.top) - e.shiftKey ? 0.5 : 2 + "px"; }),
        new Keybind((e) => e.code == "ArrowRight", (e) => { Refdrop.refImage.style.left = parseInt(Refdrop.refImage.style.left) + e.shiftKey ? 0.5 : 2 + "px"; }),
        new Keybind((e) => e.code == "ArrowDown", (e) => { Refdrop.refImage.style.top = parseInt(Refdrop.refImage.style.top) + e.shiftKey ? 0.5 : 2 + "px"; }),
    ],
    // Refdrop variables
    refUpload: undefined, // HTMLDivElement
    refImage: undefined, // HTMLImageELement
    refCtrl: undefined, // HTMLDivElement
    refSocket: undefined, // HTMLDivElement
    seFunctions: null, // { clickBridge: function, screenshot: function }

    init(modules) {
        Refdrop.seFunctions = Refdrop.initRefdrop();
        Refdrop.onSocketClick = Refdrop.seFunctions.clickBridge;
        Refdrop.initRefctrl();
    },
    mutation(oldPhase, newPhase) {
        // Recover the ref controls from the lower corners so that we don't lose track of them.
        document.body.appendChild(Refdrop.refUpload);
        document.body.appendChild(Refdrop.refCtrl);
        // Recover the refimg from the overlay position so that we don't lose track of it.
        Refdrop.refUpload.appendChild(Refdrop.refImage);
        Refdrop.refImage.style.visibility = "hidden";

        if (newPhase == "draw") {
            setTimeout(Refdrop.placeRefdropControls, 200);
        } else {
            Refdrop.refUpload.style.display = "none";
            Refdrop.refCtrl.style.display = "none";
        }
    },
    backToLobby(oldPhase) {
        Refdrop.refImage.src = "";
    },
    adjustSettings(previous, current) {
        switch (current) {
            case 'off':
                document.querySelectorAll(".wiw-close").forEach(v => v.parentNode.parentNode.remove()); // This closes all references, forcing you to drag them in again.
                Refdrop.refImage.src = "";
                Refdrop.refUpload.style.visibility = "hidden";
                Refdrop.refCtrl.style.visibility = "hidden";
                return;
            case 'on':
                Refdrop.refUpload.style.visibility = "visible";
                Refdrop.onSocketClick = Refdrop.seFunctions.clickBridge;
                Refdrop.refSocket.style.backgroundImage = "url(" + ref_ul + ")";
                return;
            case 'red':
                Refdrop.refCtrl.style.visibility = "visible";
                Refdrop.onSocketClick = Refdrop.seFunctions.screenshot;
                Refdrop.refSocket.style.backgroundImage = "url(" + ref_ss + ")";
                return;
        }
    },
    // update42(type, data) {},
    initRefdrop() {
        Refdrop.refImage = setAttributes(document.createElement("img"), { class: "bounded", id: "ref-img" });
        Refdrop.refUpload = setAttributes(document.createElement("div"), { style: "display: none", class: "ref-square", id: "ref-se", parent: document.body });
        const refForm = setAttributes(document.createElement("form"), { class: "upload-form", parent: Refdrop.refUpload });
        const refBridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: refForm });
        Refdrop.refSocket = setAttributes(document.createElement("div"), { class: "ref-border upload-socket hover-button", style: "background-image:url(" + ref_ul + ")", parent: refForm });

        window.addEventListener("dragenter", function (e) {
            // Console.log("dragenter", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            Refdrop.refSocket.style.backgroundImage = "url(" + ref_ul + ")";
        });
        window.addEventListener("dragleave", function (e) {
            // Console.log("dragleave", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            if (e.fromElement || e.relatedTarget !== null) { return; }
            Console.log("Dragging back to OS", 'Refdrop');
            if (Refdrop.setting.current() == 'red') { Refdrop.refSocket.style.backgroundImage = "url(" + ref_ss + ")"; }
        });
        window.addEventListener("drop", function (e) {
            Console.log("drop", 'Refdrop');
            if (Refdrop.setting.current() == 'red') { Refdrop.refSocket.style.backgroundImage = "url(" + ref_ss + ")"; }
        }, true);
        window.addEventListener("dragover", function (e) {
            e.preventDefault();
        });
        Refdrop.refSocket.addEventListener("dragenter", function (e) {
            preventDefaults(e);
            Refdrop.refSocket.classList.add('highlight');
        }, false);['dragleave', 'drop'].forEach(eventName => {
            Refdrop.refSocket.addEventListener(eventName, function (e) {
                preventDefaults(e);
                Refdrop.refSocket.classList.remove('highlight');
            }, false);
        });
        Refdrop.refSocket.addEventListener("click", function () {
            Refdrop.onSocketClick();
        });
        refBridge.addEventListener("change", () => { handleFiles(refBridge.files); });
        Refdrop.refSocket.addEventListener('drop', handleDrop, false);

        Refdrop.refUpload.style.visibility = "hidden";

        return { clickBridge: () => { refBridge.click(); }, screenshot: () => screenshot() };

        function handleDrop(e) {
            let dt = e.dataTransfer;
            let files = dt.files;

            handleFiles(files);
        }
        function handleFiles(files) {
            document.querySelector(".core").classList.remove("watermark");

            switch (Refdrop.setting.current()) {
                case 'on':
                    Refdrop.newRefimgWIW(files.item(0));
                    break;
                case 'red':
                    Refdrop.refImage.style.visibility = "visible";
                    Refdrop.refImage.src = URL.createObjectURL(files.item(0));

                    document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
                    break;
                default:
                    Console.alert("Intended refimg location not recognised", 'Refdrop');
                    break;
            }
        }
        function screenshot() {
            Refdrop.refImage.src = document.querySelector(".core").querySelector("canvas").toDataURL();
            document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
            Refdrop.refImage.style.visibility = "visible";
            Console.log("Screenshot taken", 'Refdrop');
        }
    },
    initRefctrl() {
        Refdrop.refCtrl = setAttributes(document.createElement("div"), { id: "ref-sw", class: "ref-square" });
        const refpos = setAttributes(document.createElement("div"), { class: "ref-border canvas-in-square", parent: Refdrop.refCtrl });
        const refdot = setAttributes(document.createElement("div"), { id: "ref-dot", class: "ref-border bounded", parent: refpos });
        const reflower = setAttributes(document.createElement("div"), { class: "canvas-square-lower-tray", parent: Refdrop.refCtrl });
        const refz = setAttributes(document.createElement("div"), { class: "ref-border ref-tray-button hover-button", /*style: "background-image:url(" + chrome.runtime.getURL("assets/downz.png") + ")",*/ parent: reflower });
        const refc = setAttributes(document.createElement("div"), { class: "ref-border ref-tray-button hover-button", parent: reflower });
        const refoholder = setAttributes(document.createElement("div"), { class: "ref-border ref-tray-button hover-button", parent: reflower });
        const refo = setAttributes(document.createElement("input"), { id: "refo", type: "range", value: "25", parent: refoholder });

        initPantograph(refdot, Refdrop.refImage);
        initZ(refz, Refdrop.refImage);
        initCenter(refc, Refdrop.refImage);
        initOpacity(refo, Refdrop.refImage);
        function initPantograph(small, large) {
            var parentCoords = {}; var ratio = 1; const parent = small.parentElement;
            small.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();

                parentCoords = getCoords(small.parentElement);
                ratio = large.parentElement.clientWidth / small.parentElement.clientWidth;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e.preventDefault();
                // set the element's new position:
                const left = clamp(0, e.clientX - parentCoords.left, parent.offsetWidth);
                const top = clamp(0, e.clientY - parentCoords.top, parent.offsetHeight);
                small.style.left = left + "px";
                small.style.top = top + "px";
                large.style.left = ratio * left + "px";
                large.style.top = ratio * top + "px";
            }

            function closeDragElement() {
                // stop moving when mouse button is released:
                document.onmouseup = null;
                document.onmousemove = null;
            }

            // Taken from https://stackoverflow.com/questions/5598743
            function getCoords(elem) {
                var box = elem.getBoundingClientRect();

                var body = document.body;
                var docEl = document.documentElement;

                var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
                var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

                var clientTop = docEl.clientTop || body.clientTop || 0;
                var clientLeft = docEl.clientLeft || body.clientLeft || 0;

                var top = box.top + scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;

                return { top: Math.round(top), left: Math.round(left) };
            }
        }
        function initZ(z, large) {
            z.textContent = "↓";
            z.addEventListener("click", function () {
                if (large.style.zIndex == "1") {
                    large.style.zIndex = "0";
                    z.textContent = "↓";
                    // z.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/downz.png") + ")"
                } else {
                    large.style.zIndex = "1";
                    z.textContent = "↑";
                    // z.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/upz.png") + ")"
                }
            });
        }
        function initCenter(c, large) {
            c.textContent = "⊕";
            large.style.top = "212px";
            large.style.left = "379px";
            c.addEventListener("click", function () {
                refdot.style.top = "50%";
                refdot.style.left = "50%";
                large.style.top = "212px";
                large.style.left = "379px";
            });
        }
        function initOpacity(o, large) {
            large.style.opacity = o.value / 100;
            o.addEventListener("input", function () {
                large.style.opacity = o.value / 100;
            });
        }

        Refdrop.refCtrl.style.visibility = "hidden";
    }, // [R6]
    onSocketClick() { }, // Dynamically set
    placeRefdropControls() {
        document.querySelector(".tools").insertAdjacentElement("beforebegin", Refdrop.refUpload);
        document.querySelector(".tools").insertAdjacentElement("afterend", Refdrop.refCtrl);
        Refdrop.refUpload.style.display = "initial";
        Refdrop.refCtrl.style.display = "initial";

        Refdrop.refUpload.style.visibility = "visible";
        if (Refdrop.setting.current() == 'red') { Refdrop.refCtrl.style.visibility = "visible"; }
        //Debug.log(Refdrop, "Refdrop placed")
    }, // [R5]
    newRefimgWIW(object) {
        const i = setAttributes(new Image(), { class: "wiw-img", src: URL.createObjectURL(object) });
        i.onload = function () {
            const newRefWIW = Inwindow.new(true, true, i.height / i.width);
            newRefWIW.body.appendChild(i);
        };
        /*
        const newRefWIWImg = new Image();
        newRefWIWImg.classList.add("wiw-img");
        newRefWIW.children[1].appendChild(newRefWIWImg);
        newRefWIWImg.src = URL.createObjectURL(object);*/
    } // [R4]
};
Object.setPrototypeOf(Refdrop, CellulartModule)

export default Refdrop

import CellulartModule from './CellulartModule.js'
import { 
    RedSettingsBelt,
    Console,
    Inwindow,
    Keybind,
    setAttributes, clamp, preventDefaults
} from '../foundation'
import RefUL from '../assets/module-assets/ref-ul.png'
import RefSS from '../assets/module-assets/ref-ss.png'

 /* ----------------------------------------------------------------------
  *                                 Refdrop 
  * ---------------------------------------------------------------------- */
/** Refdrop allows you to upload reference images over or behind the canvas,
  * with controls for position and opacity.
  * Includes arrow key keybinds for adjustment of the image when in Red mode.
  * ---------------------------------------------------------------------- */
const Refdrop = { // [R1]
    name : "Refdrop",
    setting : new RedSettingsBelt('on'),
    keybinds : [
        new Keybind((e) => e.code == "ArrowLeft" , (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowUp"   , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowRight", (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) + e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowDown" , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  + e.shiftKey ? 0.5 : 2 + "px" }),
                ],
    // Refdrop variables
    refUpload : undefined, // HTMLDivElement
    refImage : undefined,  // HTMLImageELement
    refCtrl : undefined,   // HTMLDivElement
    refSocket : undefined, // HTMLDivElement
    seFunctions : null,    // { clickBridge: function, screenshot: function }

    init(modules) {
        this.seFunctions = this.initRefdrop();
        this.onSocketClick = this.seFunctions.clickBridge;
        this.initRefctrl()
    },
    mutation(oldPhase, newPhase) {
        // Recover the ref controls from the lower corners so that we don't lose track of them.
        // document.body.appendChild(this.refUpload);
        // document.body.appendChild(this.refCtrl)
        // Recover the refimg from the overlay position so that we don't lose track of it.
        // this.refUpload.appendChild(this.refImage);
        this.refImage.style.visibility = "hidden";
    
        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))

        if (newPhase == "draw" && !(this.isSetTo('off'))) {
            setTimeout(() => { this.placeRefdropControls() }, 200)
        } else {
            this.refUpload.style.display = "none";
            this.refCtrl.style.display = "none";
        }
    },
    backToLobby(oldPhase) {
        this.refImage.src = "";
    },
    adjustSettings(previous, current) {
        switch (current) {
            case 'off': 
                document.querySelectorAll(".wiw-close").forEach(v => v.parentNode.parentNode.remove()) // This closes all references, forcing you to drag them in again.
                this.refImage.src = "";
                this.refUpload.style.visibility = "hidden";
                this.refCtrl.style.visibility = "hidden";
                return;
            case 'on':
                this.refUpload.style.visibility = "visible"
                this.onSocketClick = this.seFunctions.clickBridge;
                this.refSocket.style.backgroundImage = "url(" + RefUL + ")";
                return;
            case 'red':
                this.refCtrl.style.visibility = "visible";
                this.onSocketClick = this.seFunctions.screenshot;
                this.refSocket.style.backgroundImage = "url(" + RefSS + ")";
                return;
        }
    },

    initRefdrop() {
        this.refImage = setAttributes(document.createElement("img"),  { class: "bounded",    id: "ref-img"    })
        this.refUpload = setAttributes(document.createElement("div"), { style: "display: none", class: "ref-square", id: "ref-se",    parent: document.body });
        const refForm = setAttributes(document.createElement("form"),    { class: "upload-form",                 parent: this.refUpload });  
        const refBridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: refForm });
        this.refSocket = setAttributes(document.createElement("div"),   { class: "ref-border upload-socket hover-button", style: "background-image:url(" + RefUL + ")", parent: refForm });

        window.addEventListener("dragenter", (e) => {
            // Console.log("dragenter", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            Refdrop.refSocket.style.backgroundImage = "url(" + RefUL + ")"; 
        })
        window.addEventListener("dragleave", (e) => {
            // Console.log("dragleave", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            if (e.fromElement || e.relatedTarget !== null) { return }
            Console.log("Dragging back to OS", 'Refdrop')
            if (Refdrop.isSetTo('red')) { Refdrop.refSocket.style.backgroundImage = "url(" + RefSS + ")"; }
        })
        window.addEventListener("drop", (e) => {
            Console.log("drop", 'Refdrop')
            if (Refdrop.isSetTo('red')) { Refdrop.refSocket.style.backgroundImage = "url(" + RefSS + ")"; }
        }, true)
        window.addEventListener("dragover", (e) => {
            e.preventDefault()
        })
        Refdrop.refSocket.addEventListener("dragenter", (e) => {
            preventDefaults(e)
            Refdrop.refSocket.classList.add('highlight')
        }, false)
        ;['dragleave', 'drop'].forEach(eventName => {
            Refdrop.refSocket.addEventListener(eventName, (e) => {
                preventDefaults(e)
                Refdrop.refSocket.classList.remove('highlight')
            }, false)
        })
        Refdrop.refSocket.addEventListener("click", function() {
            Refdrop.onSocketClick();
        })
        refBridge.addEventListener("change", () => { handleFiles(refBridge.files) })
        Refdrop.refSocket.addEventListener('drop', handleDrop, false)

        Refdrop.refUpload.style.visibility = "hidden";

        return { clickBridge: () => { refBridge.click() }, screenshot: () => screenshot() };

        function handleDrop(e) {
            let dt = e.dataTransfer
            let files = dt.files

            handleFiles(files)
        }
        function handleFiles(files) {
            document.querySelector(".core").classList.remove("watermark")
    
            console.log(this)
            switch (Refdrop.setting.current) {
                case 'on':
                    Refdrop.newRefimgWIW(files.item(0));
                    break;
                case 'red':
                    Refdrop.refImage.style.visibility = "visible";
                    Refdrop.refImage.src = URL.createObjectURL(files.item(0))
    
                    document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
                    break;
                default:
                    Console.alert("Intended refimg location not recognised", 'Refdrop')
                    break;
            } 
        }    
        function screenshot() {
            Refdrop.refImage.src = document.querySelector(".core").querySelector("canvas").toDataURL();
            document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
            Refdrop.refImage.style.visibility = "visible";
            Console.log("Screenshot taken", 'Refdrop')
        }
    },
    initRefctrl() {
        this.refCtrl  = setAttributes(document.createElement("div"),    { id: "ref-sw", class: "ref-square" })
        const refpos = setAttributes(document.createElement("div"),        { class: "ref-border canvas-in-square", parent: this.refCtrl })
        const refdot = setAttributes(document.createElement("div"),        { id: "ref-dot", class: "ref-border bounded", parent: refpos })
        const reflower = setAttributes(document.createElement("div"),      { class: "canvas-square-lower-tray", parent: this.refCtrl })
        const refz = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", /*style: "background-image:url(" + chrome.runtime.getURL("assets/downz.png") + ")",*/ parent: reflower })
        const refc = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refoholder = setAttributes(document.createElement("div"),    { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refo = setAttributes(document.createElement("input"),        { id: "refo", type: "range", value: "25", parent: refoholder })

        initPantograph(refdot, this.refImage); 
        initZ         (refz,   this.refImage);
        initCenter    (refc,   this.refImage);
        initOpacity   (refo,   this.refImage);
        function initPantograph(small, large) {
            var parentCoords = {}; var ratio = 1; const parent = small.parentElement
            small.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();
            
                parentCoords = getCoords(small.parentElement)
                ratio = large.parentElement.clientWidth / small.parentElement.clientWidth
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
        
            function elementDrag(e) {
                e. preventDefault();
                // set the element's new position:
                const left = clamp(0, e.clientX - parentCoords.left, parent.offsetWidth)
                const top = clamp(0, e.clientY - parentCoords.top, parent.offsetHeight)
                small.style.left = left + "px"
                small.style.top = top + "px"
                large.style.left = ratio * left + "px"
                large.style.top = ratio * top + "px" 
            }
        
            function closeDragElement() {
                // stop moving when mouse button is released:
                document.onmouseup = null;
                document.onmousemove = null;
            }
          
            // Taken from https://stackoverflow.com/questions/5598743
            function getCoords(elem) { // crossbrowser version
                var box = elem.getBoundingClientRect();
            
                var body = document.body;
                var docEl = document.documentElement;
            
                var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
                var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
            
                var clientTop = docEl.clientTop || body.clientTop || 0;
                var clientLeft = docEl.clientLeft || body.clientLeft || 0;
            
                var top  = box.top +  scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;
            
                return { top: Math.round(top), left: Math.round(left) };
            }
        }
        function initZ(z, large) {
            z.textContent = "↓";
            z.addEventListener("click", function() {
                if (large.style.zIndex == "1") {
                    large.style.zIndex = "0"
                    z.textContent = "↓"
                    // z.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/downz.png") + ")"
                } else {
                    large.style.zIndex = "1"
                    z.textContent = "↑"
                    // z.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/upz.png") + ")"
                }
            });
        }
        function initCenter(c, large) {
            c.textContent = "⊕";
            large.style.top = "212px"
            large.style.left = "379px"
            c.addEventListener("click", function() {
                refdot.style.top = "50%"
                refdot.style.left = "50%"
                large.style.top = "212px"
                large.style.left = "379px"
            })
        }
        function initOpacity(o, large) {
            large.style.opacity = o.value / 100
            o.addEventListener("input", function() {
                large.style.opacity = o.value / 100;
            })
        }

        this.refCtrl.style.visibility = "hidden";
    }, // [R6]
    onSocketClick() { }, // Dynamically set
    placeRefdropControls() {
        document.querySelector(".tools").insertAdjacentElement("beforebegin", this.refUpload);
        document.querySelector(".tools").insertAdjacentElement("afterend", this.refCtrl);
        this.refUpload.style.display = "initial";
        this.refCtrl.style.display = "initial";
        

        if (!(this.isSetTo('off'))) { this.refUpload.style.visibility = "visible" }
        if (this.isSetTo('red')) { this.refCtrl.style.visibility = "visible" }
        //Debug.log(Refdrop, "Refdrop placed")
    }, // [R5]
    newRefimgWIW(object) {
        const i = setAttributes(new Image(), { class: "wiw-img", src: URL.createObjectURL(object) })
        i.onload = function() {
            const newRefWIW = Inwindow.new(true, true, i.height / i.width);
            newRefWIW.body.appendChild(i)
        }
        /*
        const newRefWIWImg = new Image();
        newRefWIWImg.classList.add("wiw-img");
        newRefWIW.children[1].appendChild(newRefWIWImg);
        newRefWIWImg.src = URL.createObjectURL(object);*/
    } // [R4]
}
Object.setPrototypeOf(Refdrop, CellulartModule)

export default Refdrop
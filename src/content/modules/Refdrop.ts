

import { RedSettingsBelt, Console, Keybind, Phase, setAttributes, Inwindow, 
         setParent, getModuleAsset, preventDefaults, clamp } from "../foundation"
import { CellulartModule } from "./CellulartModule"

 /* ----------------------------------------------------------------------
  *                                 Refdrop 
  * ---------------------------------------------------------------------- */
/** Refdrop allows you to upload reference images over or behind the canvas,
  * with controls for position and opacity.
  * Includes arrow key keybinds for adjustment of the image when in Red mode.
  * ---------------------------------------------------------------------- */
class Refdrop extends CellulartModule { // [R1]
    name = "Refdrop"
    setting = RedSettingsBelt(this.name.toLowerCase(), true)
    keybinds = [
        new Keybind((e) => e.code == "ArrowLeft" , (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) - (e.shiftKey ? 0.5 : 2) + "px" }),
        new Keybind((e) => e.code == "ArrowUp"   , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  - (e.shiftKey ? 0.5 : 2) + "px" }),
        new Keybind((e) => e.code == "ArrowRight", (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) + (e.shiftKey ? 0.5 : 2) + "px" }),
        new Keybind((e) => e.code == "ArrowDown" , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  + (e.shiftKey ? 0.5 : 2) + "px" }),
                ]
    // Refdrop variables
    refUpload : HTMLDivElement   // HTMLDivElement
    refImage : HTMLImageElement  // HTMLImageElement
    refBridge : HTMLInputElement //
    refSocket : HTMLDivElement   // HTMLDivElement
    refCtrl : HTMLDivElement | undefined     // HTMLDivElement
    refFloating : Inwindow[] = []

    constructor() {
        super()

        const refImage = document.createElement("img")
        setAttributes(refImage, { class: "bounded", id: "ref-img" })
        this.refImage = refImage

        const refUpload = document.createElement("div")
        setAttributes(refUpload, { style: "display: none; visibility: hidden", class: "ref-square", id: "ref-se" })
        setParent(refUpload, document.body)
        this.refUpload = refUpload

        const refForm = document.createElement("form")
        setAttributes(refForm, { class: "upload-form" });  
        setParent(refForm, refUpload)

        const refBridge = document.createElement("input")
        setAttributes(refBridge, { class: "upload-bridge", type: "file" });
        setParent(refBridge, refForm)
        this.refBridge = refBridge

        const refSocket = document.createElement("div")
        setAttributes(refSocket, { class: "ref-border upload-socket hover-button", style: "background-image:url(" + getModuleAsset("ref-ul.png") + ")" });
        setParent(refSocket, refForm)
        this.refSocket = refSocket


        window.addEventListener("dragenter", (e) => {
            // Console.log("dragenter", Refdrop); Console.log(e.relatedTarget, Refdrop)
            refSocket.style.backgroundImage = "url(" + getModuleAsset("ref-ul.png") + ")"; 
        })
        window.addEventListener("dragleave", (e: any) => {
            // Console.log("dragleave", Refdrop); Console.log(e.relatedTarget, Refdrop)
            if (e.fromElement || e.relatedTarget !== null) { return }
            Console.log("Dragging back to OS", 'Refdrop')
            if (this.isSetTo('red')) { refSocket.style.backgroundImage = "url(" + getModuleAsset("ref-ss.png") + ")"; }
        })
        window.addEventListener("drop", (e) => {
            Console.log("drop", 'Refdrop')
            if (this.isSetTo('red')) { refSocket.style.backgroundImage = "url(" + getModuleAsset("ref-ss.png") + ")"; }
        }, true)
        window.addEventListener("dragover", (e) => {
            e.preventDefault()
        })
        refSocket.addEventListener("dragenter", (e) => {
            preventDefaults(e)
            refSocket.classList.add('highlight')
        }, false)
        ;['dragleave', 'drop'].forEach(eventName => {
            refSocket.addEventListener(eventName, (e) => {
                preventDefaults(e)
                refSocket.classList.remove('highlight')
            }, false)
        })
        refSocket.addEventListener("click", () => {
            this.onSocketClick();
        })
        refBridge.addEventListener("change", () => { this.handleFiles(refBridge.files) })
        refSocket.addEventListener('drop', (e) => {
            let dt = e.dataTransfer
            if (!dt) { return }

            let files = dt.files
            this.handleFiles(files)
        }, false)

        // this.refCtrl = this.initRefctrl()
    }
    mutation(oldPhase: Phase, newPhase: Phase) {
        // Recover the ref controls from the lower corners so that we don't lose track of them.
        // document.body.appendChild(this.refUpload);
        // document.body.appendChild(this.refCtrl)
        // Recover the refimg from the overlay position so that we don't lose track of it.
        // this.refUpload.appendChild(this.refImage);
        this.refImage.style.visibility = "hidden";
    
        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))

        if (newPhase == "draw" && !(this.isSetTo('off'))) {
            const tools = document.querySelector(".tools")
            if (!tools) { Console.alert("Couldn't find where to insert Refdrop controls", "Refdrop"); return }

            if (this.isSetTo("on")) {
                setTimeout(() => { this.placeRefUpload(tools) }, 200)
            }
            if (this.isSetTo("red")) {
                setTimeout(() => { this.placeRefUpload(tools) }, 200)
                setTimeout(() => { this.placeRefCtrl(tools) }, 200)
            }
            Console.log("Refdrop controls placed", "Refdrop")
        } else {
            this.refUpload.style.display = "none";
            if (this.refCtrl) { this.refCtrl.style.display = "none" }
        }
    }
    roundStart() {

    }
    roundEnd() {
        this.refImage.src = "";
    }
    adjustSettings(previous: string, current: string) {
        if (this.isSetTo("off")) {
            for (const floating of this.refFloating) {
                floating.element.remove()
            }; this.refFloating = []
            // document.querySelectorAll(".wiw-close").forEach(v => v.parentNode.parentNode.remove()) // This closes all references, forcing you to drag them in again.
            this.refImage.src = "";
            this.refUpload.style.visibility = "hidden";
            if (this.refCtrl) { this.refCtrl.style.visibility = "hidden"; }
        } else if (this.isSetTo("on")) {
            this.refUpload.style.visibility = "visible"
            this.refSocket.style.backgroundImage = "url(" + getModuleAsset("ref-ul.png") + ")";
        } else if (this.isSetTo("red")) {
            if (this.refCtrl) { this.refCtrl.style.visibility = "visible"; }
            this.refSocket.style.backgroundImage = "url(" + getModuleAsset("ref-ss.png") + ")";
        } 
    }
    togglePlus(plus: boolean) { 
        super.togglePlus(plus)

        if (plus) { this.refCtrl = this.initRefctrl() }
    }

    screenshot() {
        const core = document.querySelector(".core")
        if (!core) { Console.alert("Could not find core", "Refdrop"); return }
        const coreCanvas = core.querySelector("canvas")
        if (!coreCanvas) { Console.alert("Could not find active canvas", "Refdrop"); return }

        this.refImage.src = coreCanvas.toDataURL();
        this.refImage.style.visibility = "visible";
        core.insertAdjacentElement("afterbegin", this.refImage);
        Console.log("Screenshot taken", 'Refdrop')
    }
    initRefctrl() {
        const refCtrl = document.createElement("div"); setAttributes(refCtrl, { id: "ref-sw", class: "ref-square", style:"visibility: hidden" })
        const refpos = document.createElement("div"); setAttributes(refpos, { class: "ref-border canvas-in-square"}); setParent(refpos, refCtrl)
        const refdot = document.createElement("div"); setAttributes(refdot, { id: "ref-dot", class: "ref-border bounded"}); setParent(refdot, refpos)
        const reflower = document.createElement("div"); setAttributes(reflower, { class: "canvas-square-lower-tray"}); setParent(reflower, refCtrl)
        const refz = document.createElement("div"); setAttributes(refz, { class : "ref-border ref-tray-button hover-button"}); setParent(refz, reflower)
        const refc = document.createElement("div"); setAttributes(refc, { class : "ref-border ref-tray-button hover-button"}); setParent(refc, reflower)
        const refoholder = document.createElement("div"); setAttributes(refoholder, { class : "ref-border ref-tray-button hover-button"}); setParent(refoholder, reflower )
        const refo = document.createElement("input"); setAttributes(refo, { id: "refo", type: "range", value: "25"}); setParent(refo, refoholder )

        initPantograph(refdot, this.refImage); 
        initZ         (refz,   this.refImage);
        initCenter    (refc,   this.refImage);
        initOpacity   (refo,   this.refImage);

        return refCtrl

        function initPantograph(small: HTMLElement, large: HTMLElement) {
            // Precondition: small.parentElement && large.parentElement !== undefined
            var parentCoords: { top:number, left:number } = { top:0, left:0 }; 
            var ratio = 1
            const smallParent = small.parentElement!
            const largeParent = large.parentElement!

            small.onmousedown = function (e) {
                e.preventDefault();
            
                parentCoords = getCoords(smallParent)
                ratio = largeParent.clientWidth / smallParent.clientWidth
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
        
            function elementDrag(e: MouseEvent) {
                e.preventDefault();
                // set the element's new position:
                const left = clamp(0, e.clientX - parentCoords.left, smallParent.offsetWidth)
                const top = clamp(0, e.clientY - parentCoords.top, smallParent.offsetHeight)
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
            function getCoords(elem: HTMLElement): { top:number, left:number } { // crossbrowser version
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
        function initZ(z: HTMLElement, large: HTMLElement) {
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
        function initCenter(c: HTMLElement, large: HTMLElement) {
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
        function initOpacity(o: HTMLInputElement, large: HTMLElement) {
            large.style.opacity = (Number(o.value) / 100).toString()
            o.addEventListener("input", function() {
                large.style.opacity = (Number(o.value) / 100).toString();
            })
        }
    } // [R6]
    onSocketClick() {
        if (this.isSetTo("on")) {
            this.refBridge.click()
        } else if (this.isSetTo("red")) {
            this.screenshot()
        } else {
            Console.alert(`No behaviour is defined for onSocketClick in setting ${this.setting.current.internalName}`)
        }
    }
    placeRefUpload(tools: Element) {
        tools.insertAdjacentElement("beforebegin", this.refUpload);
        this.refUpload.style.visibility = "visible"
    }
    placeRefCtrl(tools: Element){
        tools.insertAdjacentElement("afterend", this.refCtrl!);
        this.refCtrl!.style.visibility = "visible" 
    }
    newRefimgInwindow(object: File): Inwindow {
        const i = new Image()
        setAttributes(i, { class: "wiw-img", src: URL.createObjectURL(object) })
        const newRefWindow = new Inwindow("default", { visible:true, ratio:i.height / i.width });
        i.onload = function() {
            newRefWindow.body.appendChild(i)
        }
        return newRefWindow
    } // [R4]
    handleFiles (files: FileList | null) {
        if (files === null || files.length < 1) { 
            Console.alert("handleFiles was triggered but no files were passed", "Refdrop")
            return 
        }

        const core = document.querySelector(".core")
        if (!core) { Console.alert("Could not find core", "Refdrop"); return }
        core.classList.remove("watermark")

        if (this.isSetTo('on')) {
            for (const file of files) {
                const newRefWindow = this.newRefimgInwindow(file)
                this.refFloating.push(newRefWindow);
            }
        } else if (this.isSetTo('red')) {
            this.refImage.style.visibility = "visible";
            this.refImage.src = URL.createObjectURL(files.item(0)!)

            core.insertAdjacentElement("afterbegin", this.refImage);
        } else {
            Console.alert(`No behaviour is defined for handleFiles in setting ${this.setting.current.internalName}`, 'Refdrop')
        }
    }    
}

export { Refdrop }
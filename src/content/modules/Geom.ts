import { Phase, WhiteSettingsBelt, Console, Inwindow, svgNS, setAttributes, setParent } from "../foundation"
import { CellulartModule } from "./CellulartModule"

const GeomOn = chrome.runtime.getURL("assets/menu-icons/geom_on.png")

// extract to SemaphoreArray class
// extract to BuffChan class
class GeomFlags {  
    interval: boolean = true
    queue: boolean = false
    pause: boolean = true
    mode: boolean = false
    ws: boolean = false
    generate: boolean = true

    notClearToSend(): boolean { 
        return !(this.interval && this.queue && !this.pause && this.mode && this.ws) 
    } 
}

 /* ----------------------------------------------------------------------
  *                                  Geom 
  * ---------------------------------------------------------------------- */
/** Geom (Geometrize) is the second generation of Gartic autodrawers 
  * after rate limiting culled the first generation.     
  * The longest module at 360 lines. Previously some of my finer work.                  
  * ---------------------------------------------------------------------- */
class ƎǃGeom extends CellulartModule {
    name = "Geom"        
    isCheat = true
    setting = new WhiteSettingsBelt()

    geomInwindow? : Inwindow        // HTMLDivElement
    geomPreview? : SVGElement        // SVGElement
    stepCallback? : number           // TimeoutID
    shapeQueue: Object[] = []              // Queue
    flags: GeomFlags = new GeomFlags()
    counters: { created: number, sent: number } = { created: 0, sent: 0 }
    config: { distance: number, max: number } = { distance: 1200, max: 20000 }

    init(): void {
        // Socket.addMessageListener('flag', (data) => {
        //     this.flags.ws = data
        // })

        // const initializedFunctions = this.initGeomWIW()
        // this.setSendPause = initializedFunctions.pause
        // this.stopGeometrize = initializedFunctions.stop
        // this.updateLabel = initializedFunctions.label
    }
    mutation(oldPhase: Phase, newPhase: Phase): void {
        this.setSendPause(true)
        if (newPhase != 'draw') { 
            this.flags.mode = false; 
            return 
        }
        this.flags.mode = true
        const preview = document.createElementNS(svgNS, "svg")
        setAttributes(preview, [["class", "geom-svg"], ["viewBox", "0 0 758 424"], ["width", "758"], ["height", "424"]])
        setParent(preview, document.querySelector(".core")!)
        this.geomPreview = preview
    }
    roundStart(): void {
        
    }
    roundEnd(): void {
        this.flags.mode = false; 
        // if (oldPhase != 'start') { this.stopGeometrize() }  // Technically redundant.
    }
    adjustSettings(previous: string, current: string) { 
        // hide or show Geom window without stopping web worker (just like Koss)
        if (current == 'off') {
            this.setSendPause(true)
            this.geomInwindow?.setVisibility("hidden");
        } else {
            this.geomInwindow?.setVisibility("visible");
        }
    }

    setSendPause(newState: boolean): void {} // Dynamically initialized
    stopGeometrize(): void {}                // Dynamically initialized
    // updateLabel(which, newValue) {},    // Dynamically initialized

    // initGeomWIW() { // [G8]
    //     const newWIW = new Inwindow(false, false, 1)
    //     setAttributes(newWIW.element, { "id":"geom-wiw" })
    //     const body = newWIW.body

    //     const geomScreen1 = constructScreen1();
    //     var geomScreen2 = undefined;
    //     var geomScreen3 = undefined;

    //     function constructScreen1() { 
    //         const o = {};

    //         o.body = setAttributes(document.createElement("div"),     { class: "geom-carpet", parent: body });
    //         o.form = setAttributes(document.createElement("form"),    { class: "upload-form",                 parent: o.body });
    //         o.bridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: o.form });
    //         o.socket = setAttributes(document.createElement("div"),   { id: "geom-socket", class: "geom-border upload-socket hover-button", style: "background-image:url(" + getResource("assets/module-assets/geom-ul.png") + ")", parent: o.form })
        
    //         ;['dragenter'].forEach(eventName => {
    //             o.socket.addEventListener(eventName, (e) => {
    //                 preventDefaults(e)
    //                 o.socket.classList.add('highlight')
    //             }, false)
    //         })
    //         ;['dragleave', 'drop'].forEach(eventName => {
    //             o.socket.addEventListener(eventName, (e) => {
    //                 preventDefaults(e)
    //                 o.socket.classList.remove('highlight')
    //             }, false)
    //         })
    //         o.socket.addEventListener("click", () => { o.bridge.click();})
    //         o.bridge.addEventListener("change", () => { startGeometrize(o.bridge.files) })
    //         o.socket.addEventListener('drop', handleDrop, false)

    //         return o

    //         function handleDrop(e) {
    //             const dt = e.dataTransfer
    //             const files = dt.files
    //             startGeometrize(files)
    //         }
    //     }
    //     function constructScreen2() {
    //         Console.log("Constructing screen 2", 'Geom')

    //         var configActive = false;

    //         const iconPause = "url(" + getResource("assets/module-assets/geom-pause.png") + ")"
    //         const iconPlay = "url(" + getResource("assets/module-assets/geom-play.png") + ")"
    //         const o = {};

    //         o.body = setAttributes(document.createElement("div"),  { class: "geom-carpet", style: "display: none;", parent: body })
    //         o.echo = setAttributes(document.createElement("div"),     { id: "geom-echo", class: "hover-button canvas-in-square", parent: o.body })
    //         o.back = setAttributes(document.createElement("div"), { id: "geom-reselect", class: "geom-border hover-button", parent: o.echo })
    //         o.tray = setAttributes(document.createElement("div"),     { id: "geom-lower-tray", class: "canvas-square-lower-tray", parent: o.body })
    //         o.sendStack = setAttributes(document.createElement("div"),   { class: "geom-stack", parent: o.tray })
    //         o.sendLabel = setAttributes(document.createElement("label"),   { class: "geom-status", parent: o.sendStack })
    //         o.sendPauser = setAttributes(document.createElement("button"), { class: "geom-border geom-tray-button hover-button", parent: o.sendStack })
    //         o.genStack = setAttributes(document.createElement("div"),   { class: "geom-stack", parent: o.tray })
    //         o.genLabel = setAttributes(document.createElement("label"),  { id: "geom-total", class: "geom-status", parent: o.genStack })
    //         o.genPauser = setAttributes(document.createElement("button"),  { class: "geom-border geom-tray-button hover-button", parent: o.genStack })

    //         o.sendPauser.addEventListener("click", () => { o.setSendPause(!this.flags.pause) })
    //         o.sendPauser.style.backgroundImage = iconPlay;
    //         o.back.addEventListener("click", () => { stopGeometrize() }) // TODO put a semi-transparent negative space cancel icon instead of hover-button
    //         o.genPauser.addEventListener("click", () => { o.setGenPause(this.flags.generate) })
    //         o.genPauser.style.backgroundImage = iconPause;
    //         o.genLabel.addEventListener("click", () => { o.setGeomConfigWindow(!configActive) })

    //         o.updateLabel = (which, newValue) => {
    //             if (which == 'total') { o.genLabel.textContent = newValue }
    //             else if (which == 'sent') { o.sendLabel.textContent = newValue }
    //             else if (which == 'both') { o.genLabel.textContent = newValue; o.sendLabel.textContent = newValue }
    //         }
    //         o.setSendPause = (pause) => { 
    //             Console.log("Send " + (pause ? 'paused' : 'play'), 'Geom')
    //             if (!this.flags.mode) {  // TODO: This is kind of a bad place to put the mode check, in the middle of someone else's setter.
    //                 o.sendPauser.style.backgroundImage = iconPlay
    //                 this.flags.pause = true
    //                 return
    //             } 
    //             o.sendPauser.style.backgroundImage = pause ? iconPlay : iconPause
    //             this.flags.pause = pause
    //             if (!pause) { this.trySend() }
    //         }
    //         o.setGenPause = (pause) => {
    //             Console.log("Gen " + (pause ? 'paused' : 'play'), 'Geom')
    //             o.genPauser.style.backgroundImage = pause ? iconPlay : iconPause
    //             this.flags.generate = !pause
    //         }
    //         o.setGeomConfigWindow = (active) => {
    //             configActive = active
    //             geomScreen3 = geomScreen3 || constructScreen3()
    //             geomScreen3.body.style.display = active ? 'flex' : 'none';
    //         }

    //         return o;
    //     }
    //     function constructScreen3() {
    //         Console.log("Constructing screen 3", 'Geom')

    //         const o = {};

    //         o.body = setAttributes(document.createElement("div"),          { id: "geom-config", parent: body })
    //         o.distEntry = setAttributes(document.createElement("div"),     { class: "geom-3-hstack", parent: o.body })
    //         o.distIcon = setAttributes(document.createElement("img"),     { class: "geom-3-icon", parent: o.distEntry })
    //         o.distInput = setAttributes(document.createElement("input"), { class: "geom-3-input", parent: o.distEntry })
    //         o.maxEntry = setAttributes(document.createElement("div"),      { class: "geom-3-hstack", parent: o.body })
    //         o.maxIcon = setAttributes(document.createElement("img"),     { class: "geom-3-icon", parent: o.maxEntry  })
    //         o.maxInput = setAttributes(document.createElement("input"), { class: "geom-3-input", parent: o.maxEntry  })

    //         o.distIcon.src = getResource("assets/module-assets/geom-3d.png")
    //         o.distInput.value = this.config.distance
    //         o.distInput.addEventListener("blur", () => { 
    //             const newValue = +o.distInput.value
    //             if (isNaN(newValue) || newValue < 1) { o.distInput.value = this.config.distance; return }
    //             this.config.distance = newValue;
    //             Console.log("Config dist set to " + newValue, 'Geom')
    //         })
    //         o.maxIcon.src = getResource("assets/module-assets/geom-3m.png")
    //         o.maxInput.value = this.config.max
    //         o.maxInput.addEventListener("blur", () => { 
    //             const newValue = +o.maxInput.value
    //             if (isNaN(newValue) || newValue < 1) { o.maxInput.value = this.config.max; return }
    //             if (newValue < this.counters.created) { o.maxInput.value = this.counters.created; /* return; */}
    //             this.config.max = newValue;
    //             Console.log("Config max set to " + newValue, 'Geom')
    //         })

    //         return o;
    //     }

    //     this.geomWIW = newWIW

    //     return { 
    //         pause: (newState) => { if (geomScreen2) { geomScreen2.setSendPause(newState) } }, 
    //         stop: () => stopGeometrize(), 
    //         label: (which, newValue) => { geomScreen2.updateLabel(which, newValue) }
    //     }

    //     function stopGeometrize() {  // TODO this init can be lazier
    //         geomScreen2 = geomScreen2 || constructScreen2()
    //         geomScreen3 = geomScreen3 || constructScreen3()

    //         geomScreen1.body.style.display = 'flex';
    //         geomScreen2.body.style.display = 'none'; // TODO lazy init
    //         geomScreen3.body.style.display = 'none';
    //         // other stopping stuff
    //         geomScreen2.setSendPause(true) 
    //         clearTimeout(this.stepCallback)
    //     }
    //     function startGeometrize(files) { // [G1]
    //         geomScreen2 = geomScreen2 || constructScreen2()

    //         const dataURL = URL.createObjectURL(files.item(0))
    //         geomScreen1.body.style.display = 'none';
    //         geomScreen2.body.style.display = 'flex'; // TODO lazy init
    //         geomScreen2.echo.style.backgroundImage = "url(" + dataURL + ")"

    //         geomScreen2.setGenPause(false)
    //         geomScreen2.updateLabel('both', 0)
    //         this.counters = { created:0, sent:0 }
    //         this.shapeQueue = [];
    //         this.flags.queue = false;

    //         const img = new Image();
    //         img.src = dataURL;
    //         img.onload = function() {
    //             this.geometrize(img)
    //         };
    //     }
    // }
    // async geometrize(img) {
    //     const resizedDimensions = view_fit(758, 424, img.naturalWidth, img.naturalHeight) 
    //     const canvas = setAttributes(document.createElement("canvas"), { width:resizedDimensions.x, height: resizedDimensions.y });
    //     const context = canvas.getContext("2d");
    //     //Debug.log(Geom, resizedDimensions)
    //     context.drawImage(img, resizedDimensions.margin.x / 2, resizedDimensions.margin.y / 2, resizedDimensions.x, resizedDimensions.y);
    //     const imgdata = context.getImageData(0, 0, 758, 424)

    //     this.queryGW("set", { width: 758, height: 424, data: imgdata.data }).then((response) => {
    //         if (response.status != 200) { Console.log("Could not recognise imagedata", 'Geom'); return; }
    //         Console.log("Image processed successfully. Beginning Geometrize", 'Geom');
    //         step()
    //     })

    //     // function view_clamp(maxx, maxy, elementx, elementy) {
    //     //     const ratiox = maxx / elementx
    //     //     const ratioy = maxy / elementy
    //     //     if (ratiox > 1 && ratioy > 1) { 
    //     //         return { margin: { x: maxx - elementx, y: maxy - elementy }, x:elementx, y:elementy } 
    //     //     } else if (ratiox < ratioy) {
    //     //         const resizedy = Math.floor(elementy * ratiox)
    //     //         return { margin: { x:0, y:maxy - resizedy }, x: maxx, y:resizedy }
    //     //     } else {
    //     //         const resizedx = Math.floor(elementx * ratioy)
    //     //         return { margin: { x:maxx - resizedx, y:0 }, x: resizedx, y:maxy }
    //     //     }
    //     // }
    //     function view_fit(minx, miny, elementx, elementy) {
    //         const ratiox = elementx / minx;
    //         const ratioy = elementy / miny
        
    //         if (ratiox < ratioy) {
    //             const resizedy = Math.ceil(elementy / ratiox);
    //             return { margin: { x: 0, y: miny - resizedy }, x: minx, y: resizedy };
    //         } else {
    //             const resizedx = Math.ceil(elementx / ratioy);
    //             return { margin: { x: minx - resizedx, y: 0 }, x: resizedx,  y: miny };
    //         }
    //     }
    //     // function view_cover(minx, miny, elementx, elementy) {
    //     //     const ratiox = elementx / minx;
    //     //     const ratioy = elementy / miny
        
    //     //     if (ratiox > 1 && ratioy > 1) {
    //     //         return { margin: { x: minx - elementx, y: miny - elementy }, x:elementx, y:elementy }
    //     //     } else if (ratiox < ratioy) {
    //     //         const resizedy = Math.ceil(elementy / ratiox);
    //     //         return { margin: { x: 0, y: miny - resizedy }, x: minx, y: resizedy };
    //     //     } else {
    //     //         const resizedx = Math.ceil(elementx / ratioy);
    //     //         return { margin: { x: minx - resizedx, y: 0 }, x: resizedx,  y: miny };
    //     //     }
    //     // }
    //     async function step() {
    //         if (!this.flags.generate || this.counters.created >= this.config.max || this.counters.created - this.counters.sent >= this.config.distance) { 
    //             await this.queryGW(2)
    //             this.stepCallback = setTimeout(step, 250); 
    //             return 
    //         }
    //         const shape = await this.queryGW("step")
    //         if (shape === undefined) { Console.alert("Mysterious error, no shape was produced; terminating", 'Geom'); return }     
    //         Console.log(shape, 'Worker')       
    //         this.queueShape(shape)
    //         step() 
    //     }
    // }
    // queueShape(shape) {
    //     this.counters.created += 1
    //     this.shapeQueue.push(shape)
    //     this.flags.queue = true
    //     this.updateLabel('total', this.counters.created)
    
    //     setTimeout(() => { this.trySend() }, 0) // Maybe an overcomplication
    // }
    // trySend() {
    //     function gartic_format(shape) {
    //         const raw = shape.raw
    //         const type = shape.type == 0 ? 6 : 7 
    //         const color = (function(){
    //             const signed = shape.color
    //             const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
    //             const colora = unsigned.toString(16).padStart(8, '0')
    //             return colora.slice(0,6)
    //         })()
    
    //         var coords;
    //         if (type == 6) {
    //             coords = raw
    //         }
    //         else if (type == 7) {
    //             coords = [raw[0] - raw[2], raw[1] - raw[3], raw[0] + raw[2], raw[1] + raw[3]]
    //         } // else if LINE
    
    //         return { fst: '42[2,7,{"t":0,"d":1,"v":[' + type + ',',
    //                 snd: ',["#' + color + '",2,"0.5"],['
    //                 + coords[0] + ',' + coords[1]
    //                 + '],['
    //                 + coords[2] + ',' + coords[3]
    //                 + ']]}]'}
    //     }
    //     function svg_format(shape) {
    //         const raw = shape.raw
    //         const type = shape.type == 0 ? 'rect' : 'ellipse'
    //         const color = "#" + (function(){
    //             const signed = shape.color
    //             const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
    //             const colora = unsigned.toString(16).padStart(8, '0')
    //             return colora.slice(0,6)
    //         })()
    
    //         var coords;
    //         if (type == 'rect') {
    //             coords = { x: raw[0], y: raw[1], width: raw[2] - raw[0], height: raw[3] - raw[1] }
    //         }
    //         else if (type == 'ellipse') {
    //             coords = { cx: raw[0], cy: raw[1], rx: raw[2], ry: raw[3]}
    //         } // else if LINE
    
    //         return setAttributes(document.createElementNS(svgNS, type), { ...coords, fill: color, "fill-opacity": "0.5" })
    //     }

    //     // console.log(this.flags)

    //     if(this.flags.notClearToSend()) { return }
    //     this.flags.interval = false
    //     setTimeout(() => { this.flags.interval = true; this.trySend() }, 125)
    
    //     const shape = this.shapeQueue.shift()
    //     if(this.shapeQueue.length == 0) { this.flags.queue = false }
    //     const packet = gartic_format(shape)
    //     const svg = svg_format(shape)
    
    //     Socket.post('sendGeomShape', packet)
    //     this.counters.sent += 1
    //     this.geomPreview.appendChild(svg)
    //     this.updateLabel('sent', this.counters.sent)
    // }
    async queryGW(purpose: string, data=undefined) {
        const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
        const response = await chrome.runtime.sendMessage(message);
        Console.log(response, 'Worker') 
        return response
    }
}

export default GeomOn
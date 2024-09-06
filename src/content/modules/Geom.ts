import { ShapeTypes } from "geometrizejs"
import { WorkerResultShape } from "../../shared/WorkerResultShape"
import { Phase, WhiteSettingsBelt, Console, Inwindow, Socket,
    svgNS, setAttributes, setParent, preventDefaults, getResource,
    Lazy
} from "../foundation"
import { CellulartModule } from "./CellulartModule"

// extract to SemaphoreArray class
// extract to BuffChan class
class GeomFlags {  
    interval: boolean = true
    queue: boolean = false
    unpause: boolean = true
    mode: boolean = false
    ws: boolean = false
    generate: boolean = true

    notClearToSend(): boolean { 
        return !(this.interval && this.queue && this.unpause && this.mode && this.ws) 
    } 
}

type GeomScreenData = {
    elements: { [key:string]:HTMLElement }
    functions: { [key:string]:(...args: any[]) => void }
}

 /* ----------------------------------------------------------------------
  *                                  Geom 
  * ---------------------------------------------------------------------- */
/** Geom (Geometrize) is the second generation of Gartic autodrawers 
  * after rate limiting culled the first generation.     
  * The longest module at 360 lines. Previously some of my finer work.                  
  * ---------------------------------------------------------------------- */
class Geom extends CellulartModule {
    name = "Geom"        
    isCheat = true
    setting = WhiteSettingsBelt(this.name.toLowerCase())

    geomInwindow : Inwindow        // HTMLDivElement
    geomPreview : SVGElement        // SVGElement
    stepCallback : number | undefined           // TimeoutID
    shapeQueue: WorkerResultShape[] = []              // Queue
    flags: GeomFlags = new GeomFlags()
    counters: { created: number, sent: number } = { created: 0, sent: 0 }
    config: { distance: number, max: number } = { distance: 1200, max: 20000 }

    constructor() {
        super()
        Socket.addMessageListener('flag', (data: boolean) => {
            this.flags.ws = data
        })

        this.geomInwindow = this.initGeomWIW()

        const preview = document.createElementNS(svgNS, "svg")
        setAttributes(preview, { class: "geom-svg", viewBox: "0 0 758 424", width: "758", height: "424" })
        this.geomPreview = preview
    }
    mutation(oldPhase: Phase, newPhase: Phase): void {
        this.setSendPause(true)
        if (newPhase != 'draw') { 
            this.flags.mode = false; 
            return 
        }
        this.flags.mode = true

        setParent(this.geomPreview, document.querySelector(".core")!)
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
    updateLabel(which: 'total'|'sent'|'both', newValue: string) {}    // Dynamically initialized

    initGeomWIW(): Inwindow { // [G8]
        const constructScreen1 = () => { 
            const toReturn: GeomScreenData = {
                elements: {},
                functions: {}
            }
            const body = document.createElement("div")
            setAttributes(body, { class: "geom-carpet" });
            setParent(body, geomInwindow.body)
            toReturn.elements.body = body

            const form = document.createElement("form")
            setAttributes(form, { class: "upload-form" });
            setParent(form, body)
            toReturn.elements.form = form

            const bridge = document.createElement("input")
            setAttributes(bridge, { class: "upload-bridge", type: "file" });
            setParent(bridge, form)
            toReturn.elements.bridge = bridge

            const socket = document.createElement("div")
            setAttributes(socket, { id: "geom-socket", class: "geom-border upload-socket hover-button", style: "background-image:url(" + getResource("assets/module-assets/geom-ul.png") + ")" })
            setParent(socket, form)
            toReturn.elements.socket = socket
        
            ;['dragenter'].forEach(eventName => {
                socket.addEventListener(eventName, (e) => {
                    preventDefaults(e)
                    socket.classList.add('highlight')
                }, false)
            })
            ;['dragleave', 'drop'].forEach(eventName => {
                socket.addEventListener(eventName, (e) => {
                    preventDefaults(e)
                    socket.classList.remove('highlight')
                }, false)
            })
            socket.addEventListener("click", () => { bridge.click();})
            bridge.addEventListener("change", () => { startGeometrize(bridge.files) })
            socket.addEventListener('drop', handleDrop, false)

            // return o

            function handleDrop(e: DragEvent) {
                const dt = e.dataTransfer
                if (!dt) { return }
                const files = dt.files
                startGeometrize(files)
            }
            return toReturn
        }
        const constructScreen2 = () => {
            const toReturn: GeomScreenData = {
                elements: {},
                functions: {}
            }
            Console.log("Constructing screen 2", 'Geom')

            var configActive = false;

            const iconPause = "url(" + getResource("assets/module-assets/geom-pause.png") + ")"
            const iconPlay = "url(" + getResource("assets/module-assets/geom-play.png") + ")"

            const body = document.createElement("div")
            setAttributes(body, { class: "geom-carpet", style: "display: none;" }); setParent(body, geomInwindow.body)
            toReturn.elements.body = body
            const echo = document.createElement("div")
            setAttributes(echo, { id: "geom-echo", class: "hover-button canvas-in-square" }); setParent(echo, body)
            toReturn.elements.echo = echo
            const back = document.createElement("div")
            setAttributes(back, { id: "geom-reselect", class: "geom-border hover-button" }); setParent(back, echo)
            const tray = document.createElement("div")
            setAttributes(tray, { id: "geom-lower-tray", class: "canvas-square-lower-tray" }); setParent(tray, body)

            const sendStack = document.createElement("div")
            setAttributes(sendStack, { class: "geom-stack" }); setParent(sendStack, tray)
            const sendLabel = document.createElement("label")
            setAttributes(sendLabel, { class: "geom-status" }); setParent(sendLabel, sendStack)
            const sendPauser = document.createElement("button") 
            setAttributes(sendPauser, { class: "geom-border geom-tray-button hover-button" }); setParent(sendPauser, sendStack)

            const genStack = document.createElement("div")
            setAttributes(genStack, { class: "geom-stack" }); setParent(genStack, tray)
            const genLabel = document.createElement("label")
            setAttributes(genLabel, { id: "geom-total", class: "geom-status" }); setParent(genLabel, genStack)
            const genPauser = document.createElement("button")
            setAttributes(genPauser, { class: "geom-border geom-tray-button hover-button" }); setParent(genPauser, genStack)

            const updateLabel = (which: 'total'|'sent'|'both', newValue: string) => {
                if (which == 'total') { genLabel.textContent = newValue }
                else if (which == 'sent') { sendLabel.textContent = newValue }
                else if (which == 'both') { genLabel.textContent = newValue; sendLabel.textContent = newValue }
            }
            toReturn.functions.updateLabel = updateLabel

            const setSendPause = (newIsUnpaused: boolean) => {
                Console.log("Send " + newIsUnpaused ? "play" : "pause", 'Geom')
                if (!this.flags.mode) {  // TODO: This is kind of a bad place to put the mode check, in the middle of someone else's setter.
                    sendPauser.style.backgroundImage = iconPlay
                    this.flags.unpause = true
                    return
                } 
                sendPauser.style.backgroundImage = newIsUnpaused ? iconPlay : iconPause
                this.flags.unpause = newIsUnpaused
                if (newIsUnpaused) { this.trySend() }
            }
            toReturn.functions.setSendPause = setSendPause

            const setGenPause = (newIsPaused: boolean) => {
                Console.log("Gen " + newIsPaused ? "pause" : "play", 'Geom')
                genPauser.style.backgroundImage = newIsPaused ? iconPause : iconPlay
                this.flags.generate = newIsPaused
            }
            toReturn.functions.setGenPause = setGenPause

            const setGeomConfigWindow = (active: boolean) => {
                configActive = active
                // geomScreen3 = geomScreen3 || constructScreen3()
                geomScreen3.value.elements.body.style.display = active ? 'flex' : 'none';
            }
            toReturn.functions.setGeomConfigWindow = setGeomConfigWindow

            sendPauser.addEventListener("click", () => { setSendPause(!this.flags.unpause) })
            sendPauser.style.backgroundImage = iconPlay;
            back.addEventListener("click", () => { stopGeometrize() }) // TODO put a semi-transparent negative space cancel icon instead of hover-button
            genPauser.addEventListener("click", () => { setGenPause(!this.flags.generate) })
            genPauser.style.backgroundImage = iconPause;
            genLabel.addEventListener("click", () => { setGeomConfigWindow(!configActive) })

            return toReturn
        }
        const constructScreen3 = () => {
            const toReturn: GeomScreenData = {
                elements: {},
                functions: {}
            }
            Console.log("Constructing screen 3", 'Geom')

            const body = document.createElement("div")
            setAttributes(body, { id: "geom-config" }); setParent(body, geomInwindow.body)
            toReturn.elements.body = body

            const distEntry = document.createElement("div")
            setAttributes(distEntry, { class: "geom-3-hstack" }); setParent(distEntry, body)
            const distIcon = document.createElement("img")
            setAttributes(distIcon, { class: "geom-3-icon" }); setParent(distIcon, distEntry)
            const distInput = (document.createElement("input"))
            setAttributes(distInput, { class: "geom-3-input" }); setParent(distInput, distEntry)

            const maxEntry = document.createElement("div")
            setAttributes(maxEntry, { class: "geom-3-hstack" }); setParent(maxEntry, body)
            const maxIcon = document.createElement("img")
            setAttributes(maxIcon, { class: "geom-3-icon" }); setParent(maxIcon, maxEntry)
            const maxInput = (document.createElement("input"))
            setAttributes(maxInput, { class: "geom-3-input" }); setParent(maxInput, maxEntry)

            distIcon.src = getResource("assets/module-assets/geom-3d.png")
            distInput.value = this.config.distance.toString()
            distInput.addEventListener("blur", () => { 
                const newValue = +distInput.value
                if (isNaN(newValue) || newValue < 1) { distInput.value = this.config.distance.toString(); return }
                this.config.distance = newValue;
                Console.log("Config dist set to " + newValue, 'Geom')
            })
            maxIcon.src = getResource("assets/module-assets/geom-3m.png")
            maxInput.value = this.config.max.toString()
            maxInput.addEventListener("blur", () => { 
                const newValue = +maxInput.value
                if (isNaN(newValue) || newValue < 1) { maxInput.value = this.config.max.toString(); return }
                if (newValue < this.counters.created) { maxInput.value = this.counters.created.toString(); /* return; */}
                this.config.max = newValue;
                Console.log("Config max set to " + newValue, 'Geom')
            })

            return toReturn
        }
        const geomInwindow = new Inwindow("default", { close:false, visible:false, ratio:1 })
        setAttributes(geomInwindow.element, { "id":"geom-wiw" })

        const geomScreen1 = constructScreen1()
        const geomScreen2 = new Lazy<GeomScreenData>(constructScreen2)
        const geomScreen3 = new Lazy<GeomScreenData>(constructScreen3)

        const stopGeometrize = () => {  // TODO this init can be lazier
            geomScreen1.elements.body.style.display = 'flex';
            geomScreen2.value.elements.body.style.display = 'none'; // TODO lazy init
            geomScreen3.value.elements.body.style.display = 'none';
            // other stopping stuff
            geomScreen2.value.functions.setSendPause(true) 
            clearTimeout(this.stepCallback)
        }
        const startGeometrize = (files: FileList | null) => { // [G1]
            if (!files) { return }
            const item = files.item(0)
            if (!item) { return }

            const dataURL = URL.createObjectURL(item)
            geomScreen1.elements.body.style.display = 'none';
            geomScreen2.value.elements.body.style.display = 'flex';
            geomScreen2.value.elements.echo.style.backgroundImage = "url(" + dataURL + ")"

            geomScreen2.value.functions.setGenPause(false)
            geomScreen2.value.functions.updateLabel('both', 0)
            this.counters = { created:0, sent:0 }
            this.shapeQueue = [];
            this.flags.queue = false;

            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                this.geometrize(img)
            };
        }

        this.setSendPause = (newState: boolean) => { geomScreen2.value.functions.setSendPause(newState) }
        this.stopGeometrize = stopGeometrize
        this.updateLabel = (which: 'total'|'sent'|'both', newValue: string) => { geomScreen2.lazyValue?.functions.updateLabel(which, newValue) }

        return geomInwindow 
    }
    async geometrize(img: HTMLImageElement) {
        const resizedDimensions = view_fit(758, 424, img.naturalWidth, img.naturalHeight) 
        const canvas = document.createElement("canvas")
        canvas.width = resizedDimensions.x; canvas.height = resizedDimensions.y;
        const context = canvas.getContext("2d")!;
        //Debug.log(Geom, resizedDimensions)
        context.drawImage(img, resizedDimensions.margin.x / 2, resizedDimensions.margin.y / 2, resizedDimensions.x, resizedDimensions.y);
        const imgdata = context.getImageData(0, 0, 758, 424)

        this.queryGW("set", { width: 758, height: 424, data: imgdata.data }).then((response) => {
            if (response.status != 200) { Console.log("Could not recognise imagedata", 'Geom'); return; }
            Console.log("Image processed successfully. Beginning Geometrize", 'Geom');
            step()
        })

        // function view_clamp(maxx, maxy, elementx, elementy) {
        //     const ratiox = maxx / elementx
        //     const ratioy = maxy / elementy
        //     if (ratiox > 1 && ratioy > 1) { 
        //         return { margin: { x: maxx - elementx, y: maxy - elementy }, x:elementx, y:elementy } 
        //     } else if (ratiox < ratioy) {
        //         const resizedy = Math.floor(elementy * ratiox)
        //         return { margin: { x:0, y:maxy - resizedy }, x: maxx, y:resizedy }
        //     } else {
        //         const resizedx = Math.floor(elementx * ratioy)
        //         return { margin: { x:maxx - resizedx, y:0 }, x: resizedx, y:maxy }
        //     }
        // }
        function view_fit(minx: number, miny: number, elementx: number, elementy: number) {
            const ratiox = elementx / minx;
            const ratioy = elementy / miny
        
            if (ratiox < ratioy) {
                const resizedy = Math.ceil(elementy / ratiox);
                return { margin: { x: 0, y: miny - resizedy }, x: minx, y: resizedy };
            } else {
                const resizedx = Math.ceil(elementx / ratioy);
                return { margin: { x: minx - resizedx, y: 0 }, x: resizedx,  y: miny };
            }
        }
        // function view_cover(minx, miny, elementx, elementy) {
        //     const ratiox = elementx / minx;
        //     const ratioy = elementy / miny
        
        //     if (ratiox > 1 && ratioy > 1) {
        //         return { margin: { x: minx - elementx, y: miny - elementy }, x:elementx, y:elementy }
        //     } else if (ratiox < ratioy) {
        //         const resizedy = Math.ceil(elementy / ratiox);
        //         return { margin: { x: 0, y: miny - resizedy }, x: minx, y: resizedy };
        //     } else {
        //         const resizedx = Math.ceil(elementx / ratioy);
        //         return { margin: { x: minx - resizedx, y: 0 }, x: resizedx,  y: miny };
        //     }
        // }
        const step = async() => {
            if (!this.flags.generate || this.counters.created >= this.config.max || this.counters.created - this.counters.sent >= this.config.distance) { 
                await this.queryGW(2)
                this.stepCallback = window.setTimeout(step, 250); 
                return 
            }
            const shape = await this.queryGW("step")
            if (shape === undefined) { Console.alert("Mysterious error, no shape was produced; terminating", 'Geom'); return }     
            Console.log(shape, 'Worker')       
            this.queueShape(shape)
            step() 
        }
    }
    queueShape(shape: WorkerResultShape) {
        this.counters.created += 1
        this.shapeQueue.push(shape)
        this.flags.queue = true
        this.updateLabel('total', this.counters.created.toString())
    
        window.setTimeout(() => { this.trySend() }, 0) // Maybe an overcomplication
    }
    trySend() {
        function gartic_format(shape: WorkerResultShape) {
            const raw = shape.raw
            const type = ((x: number) => {
                if (x == ShapeTypes.RECTANGLE) { return 6 }
                if (x == ShapeTypes.ELLIPSE) { return 7 }
            })(shape.type)
            if (!type) { 
                Console.alert(`Unknown shape type ${type}`, "Geom"); return
            }
            const color = (function(){
                const signed = shape.color
                const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
                const colora = unsigned.toString(16).padStart(8, '0')
                return colora.slice(0,6)
            })()
    
            const coords = ((type):number[]|undefined => {
                if (type == ShapeTypes.RECTANGLE) {
                    return raw
                }
                else if (type == ShapeTypes.ELLIPSE) {
                    return [raw[0] - raw[2], raw[1] - raw[3], raw[0] + raw[2], raw[1] + raw[3]]
                }
            })(shape.type)
            if (!coords) {
                Console.alert(`Unknown shape type: ${type}`, "Geom")
                return // else if LINE
            }
    
            return { fst: '42[2,7,{"t":0,"d":1,"v":[' + type + ',',
                    snd: ',["#' + color + '",2,"0.5"],['
                    + coords[0] + ',' + coords[1]
                    + '],['
                    + coords[2] + ',' + coords[3]
                    + ']]}]'}
        }
        function svg_format(shape: WorkerResultShape) {
            const raw = shape.raw
            const type = ((x: number) => {
                if (x == ShapeTypes.RECTANGLE) { return 'rect' }
                if (x == ShapeTypes.ELLIPSE) { return 'ellipse' }
            })(shape.type)
            if (!type) { 
                Console.alert(`Unknown shape type ${type}`, "Geom"); return
            }
            const color = "#" + (function(){
                const signed = shape.color
                const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
                const colora = unsigned.toString(16).padStart(8, '0')
                return colora.slice(0,6)
            })()
    
            const coords = ((type):{[key:string]:number}|undefined => {
                if (type == ShapeTypes.RECTANGLE) {
                    return { x: raw[0], y: raw[1], width: raw[2] - raw[0], height: raw[3] - raw[1] }
                }
                else if (type == ShapeTypes.ELLIPSE) {
                    return { cx: raw[0], cy: raw[1], rx: raw[2], ry: raw[3]}
                }
            })(shape.type)
            if (!coords) {
                Console.alert(`Unknown shape type: ${type}`, "Geom")
                return// else if LINE
            }
    
            const ns = document.createElementNS(svgNS, type)
            setAttributes(ns, coords as any)  // !DANGER: This is a suppressed type warning
            setAttributes(ns, { ...coords, fill: color, "fill-opacity": "0.5" })
            return ns
        }

        // console.log(this.flags)

        if(this.flags.notClearToSend()) { return }
        this.flags.interval = false
        window.setTimeout(() => { this.flags.interval = true; this.trySend() }, 125)
    
        const shape = this.shapeQueue.shift()!  // !DANGER: Empty queue suppression
        if(this.shapeQueue.length == 0) { this.flags.queue = false }
        const packet = gartic_format(shape)
        if (!packet) { return }
        const svg = svg_format(shape)
        if (!svg) { return }
    
        Socket.post('sendGeomShape', packet)
        this.counters.sent += 1
        this.geomPreview.appendChild(svg)
        this.updateLabel('sent', this.counters.sent.toString())
    }
    async queryGW(purpose: any, data: any = undefined) {
        const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
        const response = await chrome.runtime.sendMessage(message);
        Console.log(response, 'Worker') 
        return response
    }
}

export { Geom }
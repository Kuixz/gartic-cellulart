// import { ShapeTypes } from "geometrizejs"
import { WorkerResultShape } from "../../shared/WorkerResultShape"
import { Phase, WhiteSettingsBelt, Console, Inwindow, Socket,
    svgNS, setAttributes, setParent, preventDefaults, getResource,
    globalGame,
    Converter, TransitionData
} from "../foundation"
import { CellulartModule } from "./CellulartModule"

const ShapeTypes = {
    RECTANGLE: 0, 
    ROTATED_RECTANGLE: 1, 
    TRIANGLE: 2, 
    ELLIPSE: 3, 
    ROTATED_ELLIPSE: 4, 
    CIRCLE: 5, 
    LINE: 6, 
    QUADRATIC_BEZIER: 7
}

// extract to SemaphoreArray class
// extract to BuffChan class
// TODO: I don't think there's a gen pause flag for checking if Geom (the module) is turned off in the menu icons
class GeomFlags {  
    interval: boolean = true
    queue: boolean = false
    sendingPaused: boolean = true
    mode: boolean = false
    ws: boolean = false
    
    generationPaused: boolean = false

    notClearToSend(): boolean { 
        // console.log(this)
        return !(this.interval && this.queue && !this.sendingPaused && this.mode && this.ws) 
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
  * The longest module at 360 lines. cringe                  
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
    shouldClearStrokesOnMutation: boolean = true

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
    mutation(oldPhase: Phase, transitionData: TransitionData | null, newPhase: Phase): void {
        this.setSendingPaused(true)
        this.geomPreview.innerHTML = ''
        if (this.shouldClearStrokesOnMutation) {
            Socket.post('clearStrokes')
        }

        if (newPhase == 'draw') { 
            this.flags.mode = true
            setParent(this.geomPreview, document.querySelector(".core")!)
        } else {
            this.flags.mode = false; 
            return 
        } 
    }
    roundStart() {
        this.shouldClearStrokesOnMutation = Converter.continuesIndexToBoolean(globalGame.keepIndex)
    }
    roundEnd(): void {
        this.flags.mode = false; 
        this.geomPreview.innerHTML = ""
        // if (oldPhase != 'start') { this.stopGeometrize() }  // Technically redundant.
    }
    adjustSettings() { 
        // hide or show Geom window without stopping web worker (just like Koss)
        if (this.isOff()) {
            this.setSendingPaused(true)
            this.geomInwindow?.setVisibility(false);
        } else {
            this.geomInwindow?.setVisibility(true);
        }
    }

    setSendingPaused(newIsPaused: boolean): void {} // Dynamically initialized
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
            const carpet = document.createElement("div")
            setAttributes(carpet, { class: "geom-screen2" }); setParent(carpet, body)
            toReturn.elements.body = body
            const echo = document.createElement("div")
            setAttributes(echo, { id: "geom-echo", class: "geom-border hover-button canvas-in-square", style:"grid-column: span 2; margin: 0;" }); setParent(echo, carpet)
            toReturn.elements.echo = echo
            const back = document.createElement("div")
            setAttributes(back, { id: "geom-reselect", class: "geom-border hover-button", style:`background-image: url(${getResource("assets/module-assets/geom-cancel.png")})` }); setParent(back, echo)

            const sendLabel = document.createElement("span")
            setAttributes(sendLabel, { class: "cellulart-skewer geom-status" }); setParent(sendLabel, carpet)

            const genSkewer = document.createElement("span")
            setAttributes(genSkewer, { class: "cellulart-skewer geom-status" }); setParent(genSkewer, carpet)
            const genLabel = document.createElement("span")
            setAttributes(genLabel, { class: "cellulart-skewer", id: "geom-total" }); setParent(genLabel, genSkewer)
            const genShowConfig = document.createElement("img")
            setAttributes(genShowConfig, { src: getResource("assets/module-assets/geom-config.png"), id: "geom-show-config" }); setParent(genShowConfig, genSkewer)

            const sendPauser = document.createElement("button") 
            setAttributes(sendPauser, { class: "geom-border geom-tray-button hover-button" }); setParent(sendPauser, carpet)
            const genPauser = document.createElement("button")
            setAttributes(genPauser, { class: "geom-border geom-tray-button hover-button" }); setParent(genPauser, carpet)

            const updateLabel = (which: 'total'|'sent'|'both', newValue: string) => {
                if (which == 'total') { genLabel.textContent = newValue }
                else if (which == 'sent') { sendLabel.textContent = newValue }
                else if (which == 'both') { genLabel.textContent = newValue; sendLabel.textContent = newValue }
            }
            toReturn.functions.updateLabel = updateLabel

            const setSendingPaused = (newIsPaused: boolean) => {
                Console.log("Send " + (newIsPaused ? "pause" : "play"), 'Geom')
                sendPauser.style.backgroundImage = newIsPaused ? iconPlay : iconPause 
                this.flags.sendingPaused = newIsPaused
                if (!newIsPaused) { this.trySend() }
            }
            toReturn.functions.setSendingPaused = setSendingPaused

            const setGenerationPaused = (newIsPaused: boolean) => {
                Console.log("Gen " + (newIsPaused ? "pause" : "play"), 'Geom')
                genPauser.style.backgroundImage = newIsPaused ? iconPlay : iconPause
                this.flags.generationPaused = newIsPaused
            }
            toReturn.functions.setGenerationPaused = setGenerationPaused

            const setGeomConfigWindow = (active: boolean) => {
                configActive = active
                // geomScreen3 = geomScreen3 || constructScreen3()
                geomScreen3.elements.body.style.display = active ? 'flex' : 'none';
            }
            toReturn.functions.setGeomConfigWindow = setGeomConfigWindow

            setSendingPaused(!this.flags.mode);
            setGenerationPaused(false);

            sendPauser.addEventListener("click", () => { setSendingPaused(
                (this.flags.mode && !this.flags.sendingPaused) 
            )})
            back.addEventListener("click", () => { stopGeometrize() }) // TODO put a semi-transparent negative space cancel icon instead of hover-button
            genPauser.addEventListener("click", () => { setGenerationPaused(!this.flags.generationPaused) })
            genShowConfig.addEventListener("click", () => { setGeomConfigWindow(!configActive) })

            return toReturn
        }
        // TODO: Make it so that you can click anywhere in the geom screen to dismiss Screen 3.
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
            setAttributes(distEntry, { class: "cellulart-skewer geom-3-hstack" }); setParent(distEntry, body)
            const distIcon = document.createElement("img")
            setAttributes(distIcon, { class: "geom-3-icon" }); setParent(distIcon, distEntry)
            const distInput = (document.createElement("input"))
            setAttributes(distInput, { class: "geom-3-input" }); setParent(distInput, distEntry)

            const maxEntry = document.createElement("div")
            setAttributes(maxEntry, { class: "cellulart-skewer geom-3-hstack" }); setParent(maxEntry, body)
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
        const geomScreen2 = constructScreen2()
        const geomScreen3 = constructScreen3()

        const stopGeometrize = () => {  // TODO this init can be lazier
            geomScreen1.elements.body.style.display = 'flex';
            geomScreen2.elements.body.style.display = 'none'; // TODO lazy init
            geomScreen3.elements.body.style.display = 'none';
            // other stopping stuff
            geomScreen2.functions.setSendingPaused(true) 
            clearTimeout(this.stepCallback)
        }
        const startGeometrize = (files: FileList | null) => { // [G1]
            if (!files) { return }
            const item = files.item(0)
            if (!item) { return }

            const dataURL = URL.createObjectURL(item)
            geomScreen1.elements.body.style.display = 'none';
            geomScreen2.elements.body.style.display = 'flex';
            geomScreen2.elements.echo.style.backgroundImage = "url(" + dataURL + ")"

            geomScreen2.functions.setGenerationPaused(false)
            geomScreen2.functions.updateLabel('both', 0)
            this.counters = { created:0, sent:0 }
            this.shapeQueue = [];
            this.flags.queue = false;

            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                this.geometrize(img)
            };
        }

        this.setSendingPaused = (newState: boolean) => { geomScreen2.functions.setSendingPaused(newState) }
        this.stopGeometrize = stopGeometrize
        this.updateLabel = (which: 'total'|'sent'|'both', newValue: string) => { geomScreen2.functions.updateLabel(which, newValue) }

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
            // TODO: Step consistently overshoots the config max by 1 and config distance
            if (this.flags.generationPaused || this.counters.created >= this.config.max || this.counters.created - this.counters.sent >= this.config.distance) { 
                await this.queryGW(2)
                this.stepCallback = window.setTimeout(step, 250); 
                return 
            }
            const shape = await this.queryGW("step")
            if (shape === undefined) { Console.warn("Mysterious error, no shape was produced; terminating", 'Geom'); return }     
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
                Console.warn(`Unknown shape type ${type}`, "Geom"); return
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
                Console.warn(`Unknown shape type: ${type}`, "Geom")
                return // else if LINE
            }
    
            return { fst: `42[2,7,{"t":${globalGame.currentTurn - 1},"d":1,"v":[${type},`,
                    snd: `,["#${color}",2,"0.5"],[${coords[0]},${coords[1]}],[${coords[2]},${coords[3]}]]}]`
                }
        }
        function svg_format(shape: WorkerResultShape) {
            const raw = shape.raw
            const type = ((x: number) => {
                if (x == ShapeTypes.RECTANGLE) { return 'rect' }
                if (x == ShapeTypes.ELLIPSE) { return 'ellipse' }
            })(shape.type)
            if (!type) { 
                Console.warn(`Unknown shape type ${type}`, "Geom"); return
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
                Console.warn(`Unknown shape type: ${type}`, "Geom")
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

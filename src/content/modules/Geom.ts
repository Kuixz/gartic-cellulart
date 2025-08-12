// import { ShapeTypes } from "geometrizejs"
import { WorkerResultShape } from "../../shared/WorkerResultShape"
import { 
    Console, 
    WhiteSettingsBelt, 
    PhaseChangeEvent, CellulartEventType,
    Inwindow, 
    svgNS, setAttributes, setParent, preventDefaults, getResource,
    constructElement,
    StrokeSender,
    CellulartStroke,
    StrokeSendEvent,
    QueueStateChangeEvent
} from "../foundation"
import { ModuleArgs, CellulartModule } from "./CellulartModule"

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

function viewFit(minx: number, miny: number, elementx: number, elementy: number) {
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

interface GeomStroke extends CellulartStroke {
    original: WorkerResultShape
}

 /* ----------------------------------------------------------------------
  *                                  Geom 
  * ---------------------------------------------------------------------- */
/** Geom (Geometrize) is the second generation of Gartic autodrawers 
  * after rate limiting culled the first generation.     
  * Previously the longest module. After having its guts rearranged 
  * to accommodate Akasha, that title is a bit more ambiguous.             */
export class Geom extends CellulartModule {
    name = "Geom"        
    isCheat = true
    setting = WhiteSettingsBelt(this.name.toLowerCase())

    private strokeSender: StrokeSender
    private shapesGeneratedLabel: HTMLElement | null = null
    private geomInwindow: Inwindow        // HTMLDivElement
    private geomPreview: SVGElement        // SVGElement
    private stepCallback: number | undefined           // TimeoutID
    private shapeGenerationPaused: boolean = false

    constructor(moduleArgs: ModuleArgs) {
        super(moduleArgs, [
            CellulartEventType.ENTER_ROUND,
            CellulartEventType.PHASE_CHANGE,
            CellulartEventType.LEAVE_ROUND,
        ])

        this.geomInwindow = this.initGeomWIW()
        // this.socket = moduleArgs.socket
        this.strokeSender = moduleArgs.strokeSender

        const preview = document.createElementNS(svgNS, "svg")
        setAttributes(preview, { class: "geom-svg", viewBox: "0 0 758 424", width: "758", height: "424" })
        this.geomPreview = preview
    }
    protected onphasechange(event: PhaseChangeEvent): void {
        const { newPhase } = event.detail
        // this.setSendingPaused(true)
        this.geomPreview.innerHTML = ''

        if (newPhase == 'draw') { 
            setParent(this.geomPreview, document.querySelector(".core")!)
        }
    }
    protected onroundleave(): void {
        this.geomPreview.innerHTML = ""
    }

    public adjustSettings() { 
        // hide or show Geom window without stopping web worker (just like Koss)
        if (this.isOff()) {
            // this.setSendingPaused(true)
            this.strokeSender.pause(this.name)
            this.geomInwindow.setVisibility(false);
        } else {
            this.geomInwindow.setVisibility(true);
        }
    }

    // private setSendingPaused(newIsPaused: boolean): void {} // Dynamically initialized
    // private stopGeometrize(): void {}                // Dynamically initialized
    // private updateLabel(which: 'total'|'sent'|'both', newValue: string) {}    // Dynamically initialized

    private initGeomWIW(): Inwindow { // [G8]
        const geomInwindow = new Inwindow("default", { close:false, visible:false, ratio:1 });
        geomInwindow.element.id = "geom-wiw";

        // Screen 1
        const createScreen1 = () => {
            const screen1 = constructElement({
                type: "div",
                class: "geom-carpet"
            })
            screen1.innerHTML = `
                <form class="upload-form">
                    <input class="upload-bridge" type="file">
                    <div id="geom-socket" class="geom-border upload-socket hover-button" 
                        style="background-image:url(${getResource("assets/module-assets/geom-ul.png")})">
                    </div>
                </form>
            `
            const bridge = screen1.querySelector('.upload-bridge')! as HTMLInputElement
            const socket = screen1.querySelector('#geom-socket')! as HTMLElement
        
            ['dragenter'].forEach(eventName => {
                socket.addEventListener(eventName, (e) => {
                    preventDefaults(e)
                    socket.classList.add('highlight')
                }, false)
            });
            ['dragleave', 'drop'].forEach(eventName => {
                socket.addEventListener(eventName, (e) => {
                    preventDefaults(e)
                    socket.classList.remove('highlight')
                }, false)
            })
            socket.addEventListener("click", () => { bridge.click();})
            bridge.addEventListener("change", () => { startGeometrize(bridge.files) })
            socket.addEventListener('drop', (e: DragEvent) => {
                const dt = e.dataTransfer
                if (!dt) { return }
                const files = dt.files
                startGeometrize(files)
            }, false)

            return {
                element: screen1
            }
        }

        // Screen 2
        const createScreen2 = (dataURL: string) => {
            const screen2 = constructElement({
                type: 'div',
                class: 'geom-carpet',
            })
            const iconPause = `url(${getResource("assets/module-assets/geom-pause.png")})`
            const iconPlay = `url(${getResource("assets/module-assets/geom-play.png")})`
            screen2.innerHTML = `
                <div class="geom-screen2">
                    <div id="geom-echo" class="geom-border hover-button canvas-in-square" style="background-image: url(${dataURL})">
                        <div id="geom-reselect" class="geom-border hover-button" style="background-image: url(${getResource("assets/module-assets/geom-cancel.png")})"></div>
                    </div>
                    <span id="geom-send-label" class="cellulart-skewer geom-status">0</span>
                    <span id="geom-gen-label" class="cellulart-skewer geom-status">0</span>
                    <button id="geom-send-pauser" class="geom-border geom-tray-button hover-button" style="background-image: ${iconPlay};"></button>
                    <button id="geom-gen-pauser" class="geom-border geom-tray-button hover-button" style="background-image: ${iconPause};"></button>
                </div>
            `

            const screen2Back = screen2.querySelector('#geom-reselect') as HTMLElement
            // const genShowConfig = screen2.querySelector('#geom-show-config') as HTMLElement
            const screen2SendLabel = screen2.querySelector('#geom-send-label') as HTMLElement
            const screen2GenLabel = screen2.querySelector('#geom-gen-label') as HTMLElement
            const screen2SendBtn = screen2.querySelector('#geom-send-pauser') as HTMLElement
            const screen2GenBtn = screen2.querySelector('#geom-gen-pauser') as HTMLElement

            const abortController = new AbortController()
            let shapesSentCount = 0

            screen2Back.addEventListener(
                "click", 
                stopGeometrize, 
                { signal: abortController.signal }
            ) // TODO use an SVG for this button
            screen2SendBtn.addEventListener(
                "click", 
                () => { 
                    if (this.globalGame.currentPhase != "draw") {
                        Console.log("Not the right phase - send blocked", "Geom")
                        return 
                    }
                    if (this.strokeSender.isPaused) {
                        // this.strokeSender.unpause(this.name)
                        this.strokeSender.resumeQueue(this.name)
                    } else {
                        this.strokeSender.pause(this.name)
                    } 
                },
                { signal: abortController.signal }
            )
            this.strokeSender.addEventListener(
                "queuestatechange", 
                (event: Event) => {
                    const { queue, paused } = (event as QueueStateChangeEvent).detail
                    const newIsPaused = queue != this.name || paused === true

                    Console.log("Send " + (newIsPaused ? "pause" : "play"), 'Geom')
                    screen2SendBtn.style.backgroundImage = newIsPaused ? iconPlay : iconPause 
                },
                { signal: abortController.signal }
            )
            screen2GenBtn.addEventListener(
                "click", 
                () => { 
                    const newIsPaused = !this.shapeGenerationPaused
                    this.shapeGenerationPaused = newIsPaused

                    Console.log("Gen " + (newIsPaused ? "pause" : "play"), 'Geom')
                    screen2GenBtn.style.backgroundImage = newIsPaused ? iconPlay : iconPause
                },
                { signal: abortController.signal }
            )

            // Listen for the strokeSent event, check that the fromQueue == this.name, then:
            this.strokeSender.addEventListener(
                'strokesend', 
                (e: Event) => {
                    const { queue, stroke }  = (e as StrokeSendEvent).detail
                    if (queue != this.name) { 
                        return 
                    }
                    
                    const shapeAsSVG = this.formatShapeSVG((stroke as GeomStroke).original)
                    if (!shapeAsSVG) {
                        Console.warn("Failed to create svg from stroke", "Geom");
                        return;
                    }
                    this.geomPreview.appendChild(shapeAsSVG)
                    screen2SendLabel.textContent = (++shapesSentCount).toString()
                },
                { signal: abortController.signal })

            this.shapesGeneratedLabel = screen2GenLabel

            return {
                element: screen2,
                abort: abortController
            }
        }

        let currentScreen: HTMLElement = createScreen1().element
        let abortController: AbortController | null = null
        geomInwindow.body.appendChild(currentScreen)

        const stopGeometrize = () => {  // TODO this init can be lazier
            currentScreen.remove()
            abortController?.abort()
            abortController = null

            this.strokeSender.clearQueue(this.name)
            clearTimeout(this.stepCallback)

            currentScreen = createScreen1().element
            geomInwindow.body.appendChild(currentScreen)
        }
        const startGeometrize = (files: FileList | null) => { // [G1]
            currentScreen.remove()

            if (!files) { return }
            const item = files.item(0)
            if (!item) { return }

            const dataURL = URL.createObjectURL(item)

            const screen2 = createScreen2(dataURL)
            currentScreen = screen2.element
            abortController = screen2.abort
            geomInwindow.body.appendChild(currentScreen)

            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                this.geometrize(img)
            };
        }

        return geomInwindow 
    }
    async geometrize(img: HTMLImageElement) {
        const resizedDimensions = viewFit(758, 424, img.naturalWidth, img.naturalHeight) 
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

        const step = async() => {
            // TODO: Step consistently overshoots the config max by 1 and config distance
            if (this.shapeGenerationPaused) { // || this.counters.created >= this.config.max || this.counters.created - this.counters.sent >= this.config.distance) { 
                await this.queryGW(2)
                this.stepCallback = window.setTimeout(step, 125); 
                return 
            }
            const shape = await this.queryGW("step")
            if (shape === undefined) { 
                Console.warn("Mysterious error, no shape was produced; terminating", 'Geom'); 
                return;
            }     
            Console.log(shape, 'Worker')       
            this.queueShape(shape)
            step() 
        }
    }
    private queueShape(shape: WorkerResultShape) {
        // this.counters.created += 1
        // this.shapeQueue.push(shape)
        // this.flags.queue = true
        // this.updateLabel('total', this.counters.created.toString())
        const shapeAsGarticStroke: CellulartStroke | void = this.formatShapeGartic(shape)
        if (!shapeAsGarticStroke) { 
            return 
        }

        if (this.shapesGeneratedLabel) {
            this.shapesGeneratedLabel.textContent = (Number(this.shapesGeneratedLabel.textContent) + 1).toString()
        }
        this.strokeSender.enqueueStroke(this.name, shapeAsGarticStroke)
    }
    async queryGW(purpose: any, data: any = undefined) {
        const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
        const response = await chrome.runtime.sendMessage(message);
        Console.log(response, 'Worker') 
        return response
    }

    private formatShapeGartic (shape: WorkerResultShape): GeomStroke | void {
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

        return { 
            beforeN: `42[2,7,{"t":${this.globalGame.currentTurn - 1},"d":1,"v":[${type},`,
            afterN: `,["#${color}",2,"0.5"],[${coords[0]},${coords[1]}],[${coords[2]},${coords[3]}]]}]`,
            original: shape
        }
    }
    private formatShapeSVG (shape: WorkerResultShape): SVGElement | void {
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
}

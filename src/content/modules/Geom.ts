// import { ShapeTypes } from "geometrizejs"
import { WorkerResultShape } from "../../shared/WorkerResultShape"
import { getModuleAsset } from "../components"
import { 
    Console, 
    WhiteSettingsBelt, 
    PhaseChangeEvent, CellulartEventType,
    Inwindow, 
    svgNS, setAttributes, setParent, preventDefaults,
    StrokeSender,
    StrokeBuffer,
    GarticStroke
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
    private geomInwindow: Inwindow        // HTMLDivElement
    private geomPreview: SVGElement        // SVGElement
    private stepCallback: number | undefined           // TimeoutID
    private strokeBuffer: StrokeBuffer | null = null
    private shapeGenerationPaused: boolean = false

    constructor(moduleArgs: ModuleArgs) {
        super(moduleArgs, [
            CellulartEventType.ENTER_ROUND,
            CellulartEventType.PHASE_CHANGE,
            CellulartEventType.LEAVE_ROUND,
        ])

        this.geomInwindow = this.initGeomWIW()
        // this.socket = moduleArgs.socket
        this.strokeSender = moduleArgs.strokeSender;

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
            // if (this.strokeBuffer) {
            //     this.strokeSender.pause(this.strokeBuffer)
            // }
            this.geomInwindow.setVisibility(false);
        } else {
            this.geomInwindow.setVisibility(true);
        }
    }

    // private setSendingPaused(newIsPaused: boolean): void {} // Dynamically initialized
    // private stopGeometrize(): void {}                // Dynamically initialized
    // private updateLabel(which: 'total'|'sent'|'both', newValue: string) {}    // Dynamically initialized

    private initGeomWIW(): Inwindow { // [G8]
        // Drop zone
        const geomInwindow = new Inwindow("default", { 
            close:false, 
            visible:false, 
            shaded:true,
            ratio:1,
        });
        const body = geomInwindow.body
        body.innerHTML = `
            <form class="upload-form">
                <input class="upload-bridge" type="file">
                <div id="geom-socket" class="theme-border upload-socket hover-button" 
                    style="background-image:url(${getModuleAsset("geom-ul.png")})">
                </div>
            </form>
        `
        const bridge = body.querySelector('.upload-bridge')! as HTMLInputElement
        const socket = body.querySelector('#geom-socket')! as HTMLElement
    
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

        let sendingInwindow: Inwindow | null = null

        const startGeometrize = (files: FileList | null) => { // [G1]
            if (!files) { return }
            const item = files.item(0)
            if (!item) { return }

            // Close existing Geometrize buffer
            let sendingInwindowPosition = undefined;
            if (sendingInwindow) {
                sendingInwindowPosition = {
                    top: sendingInwindow.element.style.top,
                    left: sendingInwindow.element.style.left 
                }
            }
            if (this.strokeBuffer) {
                this.strokeBuffer.close()
            }

            // Create new buffer
            const dataURL = URL.createObjectURL(item)
            const { inwindow, buffer } = this.strokeSender.createSendingInwindow(
                dataURL,
                undefined,
                { position: sendingInwindowPosition }
            )
            buffer.addEventListener(
                'close', 
                () => {
                    this.strokeBuffer = null;
                    sendingInwindow = null;
                    stopGeometrize()
                }, 
            )
            buffer.addEventListener(
                'dequeuestroke',
                (e: Event) => {
                    const stroke = (e as CustomEvent<GarticStroke>).detail
                    const shapeAsSVG = this.formatShapeSVG(stroke as [number, number, [string, number, string | 1], [number, number], [number, number]])
                    if (!shapeAsSVG) {
                        Console.warn("Failed to create svg from stroke", "Geom");
                        return;
                    }
                    this.geomPreview.appendChild(shapeAsSVG)
                }
            )
            buffer.addEventListener(
                'setstrokegeneration',
                (e: Event) => {
                    const paused = (e as CustomEvent<boolean>).detail
                    this.shapeGenerationPaused = paused
                }
            )

            sendingInwindow = inwindow;
            this.strokeBuffer = buffer;

            // Begin Geometrize on image load
            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                this.geometrize(img)
            };
        }
        const stopGeometrize = () => {  
            Console.log("Stopping Geometrize", this.name)
            clearTimeout(this.stepCallback)
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
                this.stepCallback = window.setTimeout(step, 500); 
                return 
            }

            // Get and buffer shape
            const buffer = this.strokeBuffer
            const shape = await this.queryGW("step")
            if (shape === undefined) { 
                Console.warn("Mysterious error, no shape was produced; terminating", 'Geom'); 
                return;
            }     
            if (this.strokeBuffer == null || this.strokeBuffer !== buffer) { return }

            Console.log(shape, 'Worker')       
            this.queueShape(shape)

            step() 
        }
    }
    private queueShape(shape: WorkerResultShape) {
        const shapeAsGarticStroke: GarticStroke | void = this.formatShapeGartic(shape)
        if (!shapeAsGarticStroke) { 
            return 
        }

        // if (this.strokeBuffer == null) {
        //     Console.warn("Buffer not found while queueing shape", this.name)
        //     return
        // }
        // this.strokeBuffer.dispatchEvent(new CustomEvent("enqueuestroke", {
        //     detail: shapeAsGarticStroke
        // }))
        // console.log(this.strokeBuffer)
        this.strokeBuffer!.enqueueStroke(shapeAsGarticStroke)
    }
    async queryGW(purpose: any, data: any = undefined) {
        const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
        const response = await chrome.runtime.sendMessage(message);
        Console.log(response, 'Worker') 
        return response
    }

    private formatShapeGartic (shape: WorkerResultShape): GarticStroke | void {
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

        return [type,0,[`#${color}`,2,"0.5"],[coords[0],coords[1]],[coords[2],coords[3]]]
    }
    private formatShapeSVG (v: [number, number, [string, number, string | 1], [number, number], [number, number]]): SVGElement | void {
        const raw = [v[3][0], v[3][1], v[4][0], v[4][1]]
        const rawType = v[0]
        const type = ((x: number) => {
            if (x == 6) { return 'rect' }
            if (x == 7) { return 'ellipse' }
        })(rawType)
        if (!type) { 
            Console.warn(`Unknown shape type ${type}`, "Geom"); return
        }
        const color = `${v[2][0]}`;

        const coords = ((x: number) => {
            if (x == 6) {
                return { 
                    x: raw[0], 
                    y: raw[1], 
                    width: raw[2] - raw[0], 
                    height: raw[3] - raw[1] }
            }
            else if (x == 7) {
                return { 
                    cx: (raw[0] + raw[2]) / 2, 
                    cy: (raw[1] + raw[3]) / 2, 
                    rx: Math.abs((raw[0] - raw[2]) / 2), 
                    ry: Math.abs((raw[1] - raw[3]) / 2),
                }
            }
        })(rawType)
        if (!coords) {
            Console.warn(`Unknown shape type: ${type}`, "Geom")
            return// else if LINE
        }

        const ns = document.createElementNS(svgNS, type)
        // !DANGER: This is a suppressed type warning
        setAttributes(ns, { ...coords, fill: color, "fill-opacity": "0.5" } as unknown as Record<string, string>)
        return ns
    }
}

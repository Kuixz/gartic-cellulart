import * as gifenc from "gifenc"

import { 
    Console, 
    WhiteSettingsBelt, 
    PhaseChangeEvent,
    Converter, Inwindow, Setting,
    getModuleAsset, setAttributes, setParent,
    CellulartEventType,
    AlbumChangeEvent,
} from "../foundation"
import { ModuleArgs, CellulartModule } from "./CellulartModule"
import { createButton } from "../components"

type Side = "L" | "M" | "R"
type Indexable<T> = T[]|Record<number, T>

function length (agg: Indexable<any>):number {
    if (Array.isArray(agg)) {
        return agg.length
    } else {
        return Object.values(agg).length
    }
}

function initFrom(base: CanvasImageSource) {
    const canvas = document.createElement('canvas')
    setAttributes(canvas, { width: "1616px", height: "683px" })
    const context = canvas.getContext('2d')!;
    context.drawImage(base, 0, 0);
    return {canvas: canvas, context: context}
}

class GarticCompositor {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D

    constructor(base?: CanvasImageSource) {
        if (base) {
            const res = initFrom(base)
            this.canvas = res.canvas
            this.context = res.context
        } else {
            this.canvas = new HTMLCanvasElement()
            this.context = this.canvas.getContext('2d')!
        }
    }
    
    public drawInteraction(slide: Element, side: Side) {
        const canvases = slide.querySelectorAll('canvas')
        if (canvases.length > 0) { 
            for (const canvas of canvases) {
                this.drawDrawing(canvas, side) 
            }
        } else { 
            this.drawPrompt(slide.querySelector(".balloon")!.textContent, side) 
        }
    }

    public drawDrawing(drawing: CanvasImageSource, side: Side) {
        console.log(arguments)
        // console.log(side == "L" ? 33 : 825)
        this.context.drawImage(drawing, (side == "L" ? 33 : 825), 203);
    }

    public drawPrompt(prompt: string | null, side: Side) {
        const startingx = (side == "L" ? 33 : 825)
        this.context.strokeStyle = "#180454";
        this.context.lineWidth = 10;
        this.context.beginPath();
        this.context.roundRect(startingx, 203, 758, 424, [100]);
        this.context.stroke();
        this.context.fillStyle = "white";
        this.context.beginPath();
        this.context.roundRect(startingx + 5, 208, 748, 414, [95]);
        this.context.fill();

        this.drawText(prompt, (side == "L" ? 412 : 1204), 423, 60, 748, "M", "#180454");
    }

    public drawTurnsCounter(elapsed: number, total: number) {
        // console.log(elapsed); console.log(total)
        this.context.lineWidth = 15;
        
        const barLength = 1560 / total - 10;
        var count = 0
        var startingx = 33
        this.context.fillStyle = "rgba(255, 255, 255, 1)";
        while (count < elapsed) {
            this.context.fillRect(startingx, 648, barLength, 16)
            startingx += barLength + 10
            count ++
        }
        this.context.fillStyle = "rgba(255, 255, 255, 0.5)";
        while (count < total) {
            this.context.fillRect(startingx, 648, barLength, 16)
            startingx += barLength + 10
            count ++
        }
    }

    public drawText(
        text: string | null, 
        x: number, 
        y: number, 
        size: number, 
        max: number, 
        justify: Side, 
        internalColor: string
    ) {
        if (!text) { return }
        
        var fontSize = size;
        this.context.font = fontSize + 'px Black';
        var textLength = this.context.measureText(text).width;

        while (textLength > max) { 
            fontSize -= 5;
            this.context.font = fontSize + this.context.font.slice(String(fontSize).length) 
            textLength = this.context.measureText(text).width;
        }
        
        const borderwidth = fontSize / 4;
        this.context.lineWidth = borderwidth;

        var startingx = 0;
        switch (justify) {
            case "L": startingx = x + borderwidth / 2; break;
            case "M": startingx = x - this.context.measureText(text).width / 2; break;
            case "R": startingx = x - this.context.measureText(text).width - borderwidth / 2; break;
            default: throw new Error("Justify orientation not recognised");
        }
        
        if (internalColor != "#180454") {
            this.context.strokeStyle = "#180454";
            this.context.strokeText(text, startingx, y);
        }
        this.context.fillStyle = internalColor;
        this.context.fillText(text, startingx, y);
    }
    public drawName(name: string, side: Side) {
        var fontSize = 60;
        this.context.font = fontSize + 'px Black';
        var textLength = this.context.measureText(name).width;
        
        while (textLength > 500) { 
            fontSize -= 5;
            this.context.font = fontSize + this.context.font.slice(String(fontSize).length) 
            textLength = this.context.measureText(name).width;
        } // const borderwidth = fontSize / 5;

        this.context.lineWidth = fontSize / 5; // borderwidth;
        const startingx = 
            (side == "L" 
            ? (textLength < 250 ? 430 : 460)
            : (textLength < 250 ? 1186 : 1156)) 
            - this.context.measureText(name).width / 2 
                
        this.context.strokeStyle = "#180454";
        this.context.strokeText(name, startingx, 186);
        this.context.fillStyle = "#6be4c2";
        this.context.fillText(name, startingx, 186);
    }
    public drawPFP(pfpURL: string, side: Side): "complete"|HTMLImageElement { // todo: An attempt was made to repair tainted canvasses, verify
        const pfp = new Image(); 
        if (pfpURL.includes('custom-avatars-for-gartic-phone')) {
            Console.warn("SillyV's custom avatars extension doesn't work with Spotlight due to CORS reasons. Please ask SillyV to enable CORS on his S3 buckets.", "Spotlight")
            return "complete"
        }
        pfp.setAttribute('crossorigin', 'anonymous'); 
        // pfp.src = pfpURL; 
        if (pfpURL.slice(0,4) == 'url(') {
            pfp.src = pfpURL.slice(5, -2)
        } else {
            pfp.src = pfpURL; 
        }
        // console.log(pfp.src)

        if (pfp.complete) {
            this.context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175) 
        } else {
            pfp.addEventListener('load', () => { 
                this.context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175) 
            });
        }
        return pfp
    }
}

 /* ----------------------------------------------------------------------
  *                            Spotlight (DOWN)
  * ---------------------------------------------------------------------- */
/** Spotlight condenses your performance for the current round into a gif. 
  * The most spaghetti, convoluted module, second longest at 300 lines.
  * And it's not even particularly useful.                                 */
export class Spotlight extends CellulartModule { // [S1]
    name = "Spotlight"
    setting = WhiteSettingsBelt(this.name.toLowerCase())
    // Spotlight variables
    fallback: number = 0
    compositedFrameDatas: Indexable<Uint8ClampedArray | undefined> = []
    bg: HTMLImageElement                  // HTMLImageElement [S1]
    canbase: HTMLCanvasElement | undefined // HTMLCanvasElement
    
    constructor(moduleArgs: ModuleArgs) {
        super(moduleArgs, [
            CellulartEventType.ENTER_ROUND,
            CellulartEventType.PHASE_CHANGE,
            CellulartEventType.ALBUM_CHANGE,
            CellulartEventType.LEAVE_ROUND,
        ])

        const i = new Image()
        i.src = getModuleAsset("spotlight-base.png");
        this.bg = i
    }
    protected onroundenter(): void {
        this.fallback = Converter.flowIndexToFallback(this.globalGame.flowIndex)
    }
    protected onphasechange(event: PhaseChangeEvent): void {
        const { oldPhase, newPhase } = event.detail
        if (oldPhase == 'start') { return }
        if (newPhase != 'book') { return }

        Console.log(this.globalGame.host, 'Spotlight')
        Console.log(this.globalGame.user.nick, 'Spotlight')
        // if (oldPhase == "start") {
        //     // In case you had to reload in the middle of visualization
        //     this.username = (document.querySelector(".users") ?? document.querySelector(".players")).querySelector("i").parentNode.nextSibling.textContent
        // }
        this.beginCompilation()
    }
    protected onalbumchange(event: AlbumChangeEvent): void {
        // console.log('i got the album change event')
        if (event.detail.data === undefined) {
            Console.log('End of timeline reached. Beginning frame grabbing', 'Spotlight')
            this.writeResponseFrames()  
        }
    }
    protected onroundleave() {
        if (this.globalGame.currentPhase != "book") { return }
        if (this.isSetTo('off') || length(this.compositedFrameDatas) == 0 ) { return }

        const snapshotFrameData = this.compositedFrameDatas

        const dlInwindow = new Inwindow("default", { close: true, visible: true, ratio: 1 })
        const dlIcon = createButton("spotlight", () => {
            this.compileToGif(snapshotFrameData);
            return undefined
        })
        setParent(dlIcon, dlInwindow.body)
        
        this.compositedFrameDatas = []
    }
    
    public menuStep(): Setting {
        if (this.globalGame.currentPhase == "book") {  // || isNonempty(this.compositedFrameDatas)) { 
            Console.warn("Changing Spotlight settings mid-album visualization has disastrous consequences - action blocked", 'Spotlight') 
            return this.setting.current
        }

        return super.menuStep()
    }

    private beginCompilation() {
        if (this.globalGame.currentPhase != "book") { return }
        if (this.isSetTo("off")) { return }

        this.compositeBackgrounds();
        this.globalGame.turnCount > 0 
            ? this.compositedFrameDatas = new Array(this.globalGame.turnCount - 1) 
            : this.compositedFrameDatas = {}
    }

    // These functions manage the compositing of timelines into ImageDatas.
    private compositeBackgrounds() {
        if (this.isSetTo('off')) { return }
        Console.log("Forming background", "Spotlight")
        const canvas = new GarticCompositor(this.bg)
        canvas.drawText("HOSTED BY " + this.globalGame.host.toUpperCase(), 1206, 82, 50, 400, "M", "white")
        if (this.isSetTo("on")) {
            canvas.drawName(this.globalGame.user.nick.toUpperCase(), "R") 
            // this.drawPFP(context, '/images/avatar/38.svg', "R") 
            canvas.drawPFP(this.globalGame.user.avatar, "R")
            // TODO TODO TODO 
        } else {
            Console.warn("Spotlight setting not recognized", 'Spotlight')
        }
        this.canbase = canvas.canvas;
    }
    private writeResponseFrames() {
        const timeline = document.querySelector(".timeline")
        if (!timeline) { Console.warn("Could not find timeline", "Spotlight"); return }

        const slides = timeline.querySelectorAll(".item");
        const pairs = this.determineResponseIndices(Array.from(slides))

        for (const indices of pairs) {
            if (indices.key < 0) { Console.log('Did not participate in this round; no frame will be saved', 'Spotlight'); continue }
            if (indices.prev < 0) { Console.warn("Could not find fallback; no frame will be saved", 'Spotlight'); continue } //prevIndex += modeParameters[game.mode]["fallback"] }
            Console.log(`Compositing frame with indices ${indices.key},${indices.prev}`, 'Spotlight')
            this.compositeResponseFrame(Array.from(slides), indices.key, indices.prev)
        }
    }
    private determineResponseIndices(slides: Element[]) {
        const indexOfPrevSlide = (key:number):number => {
            var i = this.fallback > 0 ? key - 1 : 0; 
            /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
            while (i >= 0 && slides[i].querySelector(".empty") != null) { 
                i -= this.fallback; 
                Console.log(`Could not find prompt frame, falling back by ${this.fallback}`, 'Spotlight')
            }
            return i
        }

        var toReturn = []
        for (var keyIndex = 1; keyIndex < slides.length; keyIndex++) {
            if (this.findUsername(slides[keyIndex]) != this.globalGame.user.nick) { continue }
            var prevIndex = indexOfPrevSlide(keyIndex)
            // if (keyIndex == prevIndex)
            toReturn.push({ key:keyIndex, prev: prevIndex })
        }
        return toReturn
    }
    private compositeResponseFrame(slides: Element[], keyIndex: number, prevIndex: number) {  
        // TODO incorrectly grabbing the same image twice, wtf?
        // todo: What to do if the one being spotlighted has an EMPTY?
        // TODO: Some rounds might loop back to the same person multiple times. (Fixed?)
        if (this.isSetTo('off')) { 
            // console.log("hey bozo, it's off")
            return 
        }
        if (!this.canbase) {
            Console.warn("Canbase was not initialized", "Spotlight")
            return
        }
        const canvas = new GarticCompositor(this.canbase)

        // const side = this.setting.current == 'on' ? { key:'R', other: 'L' } : { key:'L', other: 'R' }
        const side = { key:'R' as Side, other:'L' as Side }
        const keySlide = slides[keyIndex]
        const prevSlide = slides[prevIndex]
        const prevUser = this.findUsername(prevSlide);
        const prevAvatar = this.findAvatar(prevSlide);

        console.log([side, keySlide, prevSlide, prevUser, prevAvatar])
    
        // Draw everything
        canvas.drawName(prevUser.toUpperCase(), side.other)
        const bottleneck = canvas.drawPFP(prevAvatar, side.other)  // This smells !!!
        canvas.drawInteraction(prevSlide, side.other)
        canvas.drawInteraction(keySlide, side.key)
        canvas.drawTurnsCounter(keyIndex, this.globalGame.turnCount - 1)
        // TODO being on a different tab causes image grabs to fail
    
        // Console.log("Almost", 'Spotlight')
        if (bottleneck == "complete") {
                this.compositedFrameDatas[keyIndex - 1] = canvas.context.getImageData(0, 0, 1616, 683).data
                // this.preview(canvas.canvas)
            Console.log("Success (Instant)", 'Spotlight')
        } else { 
            bottleneck.addEventListener('load', () => {
                this.compositedFrameDatas[keyIndex - 1] = canvas.context.getImageData(0, 0, 1616, 683).data
                // this.preview(canvas.canvas)
            })
            Console.log('Success (Onload)', 'Spotlight')
        }
    }  // [S3]
    private findUsername(element: Element): string {
        return (element.querySelector(".nick") ?? element.querySelector("span"))?.textContent ?? "missingno"
    }
    private findAvatar(element: Element): string {
        const avatarElement = element.querySelector('.avatar > *')
        if (!avatarElement) {
            Console.warn("Could not find avatar in this element", "Spotlight")
            return ""
        }
        return getComputedStyle(avatarElement).backgroundImage
    }
    // Compiles an array of ImageData into a GIF.
    private compileToGif(compositedFrameDatas: (Uint8ClampedArray | undefined)[]|{[key:number]:(Uint8ClampedArray|undefined)}) {
        if (this.globalGame.turnCount < 2) { 
            Console.log("Game is too short to form GIF. Cancelling", "Spotlight")
            return
        }  // TODO: Move this check. (?)
        if( this.isSetTo('off') || length(compositedFrameDatas) == 0) { return }
        Console.log('Now compiling to GIF', 'Spotlight');
        const gif = gifenc.GIFEncoder();
        
        var index = 0;
        // Console.log(compositedFrameDatas.length, Spotlight)
        while (index < length(compositedFrameDatas)) {
            Console.log("Queueing frame " + index, 'Spotlight');
            /*const canvasElement = compositedFrames[index];
            if (canvasElement != null) { gif.addFrame(canvasElement, {delay: 400}) };
            index += 1;*/
            const data = compositedFrameDatas[index];
            index += 1
            if (!data) { 
                Console.log("No data in this index", 'Spotlight')
                continue 
            }
            const format = "rgb444";
            const palette = gifenc.quantize(data, 256, { format });
            const indexed = gifenc.applyPalette(data, palette, format);
            gif.writeFrame(indexed, 1616, 683, { palette });
        }

        Console.log('Complete', 'Spotlight')
        gif.finish();
        const buffer = gif.bytesView();

        const today = new Date();
        const day = today.getDate() + "-" + (today.getMonth() + 1) + '-' + today.getFullYear()
        const time = today.getHours() + ":" + today.getMinutes()
        const filename = "Spotlight " + this.globalGame.user.nick + " " + day + " " + time + ".gif"
        const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");  // Memory leak?
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
    }
    
    // Temporary preview function
    // preview(intend) {
    //     const _window = window.open();
    //     _window.document.write('<iframe src="' + intend.toDataURL() + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    // }
}

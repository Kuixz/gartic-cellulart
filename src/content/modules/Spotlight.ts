import * as gifenc from "gifenc"

import { Phase, WhiteSettingsBelt, Console, Converter, Inwindow, Setting,
    globalGame, getModuleAsset, getResource, setAttributes, configChildTrunk
} from "../foundation"
import { CellulartModule } from "./CellulartModule"

type Side = "L" | "M" | "R"

function isNonempty (agg: any[]|{[key:string]:any}):boolean {
    if (Array.isArray(agg)) {
        return agg.some(x => x)
    } else {
        return Object.values(agg).some(x => x)
    }
}

function length (agg: any[]|{[key:string]:any}):number {
    if (Array.isArray(agg)) {
        return agg.length
    } else {
        return Object.values(agg).length
    }
}

 /* ----------------------------------------------------------------------
  *                            Spotlight (DOWN)
  * ---------------------------------------------------------------------- */
/** Spotlight condenses your performance for the current round into a gif. 
  * The most spaghetti, convoluted module, second longest at 300 lines.
  * And it's not even particularly useful.   
  * Down for maintenance.                              
  * ---------------------------------------------------------------------- */
class Spotlight extends CellulartModule { // [S1]
    name = "Spotlight"
    setting = WhiteSettingsBelt(this.name.toLowerCase())
    // Spotlight variables
    username : string = ''
    fallback : number = 0
    compositedFrameDatas : (Uint8ClampedArray | undefined)[]|{[key:number]:(Uint8ClampedArray|undefined)} = []
    bg : HTMLImageElement                  // HTMLImageElement [S1]
    canbase: HTMLCanvasElement | undefined // HTMLCanvasElement
    
    constructor() {
        super()

        const i = new Image()
        i.src = getModuleAsset("spotlight-base.png");
        this.bg = i
    }
    mutation(oldPhase: Phase, newPhase: Phase) {
        if (newPhase == 'start') { return }
        if (newPhase != 'book') { return }

        Console.log(globalGame.host, 'Spotlight')
        Console.log(this.username, 'Spotlight')
        // if (oldPhase == "start") {
        //     // In case you had to reload in the middle of visualization
        //     this.username = (document.querySelector(".users") ?? document.querySelector(".players")).querySelector("i").parentNode.nextSibling.textContent
        // }

        this.compositeBackgrounds();
        globalGame.turns > 0 
            ? this.compositedFrameDatas = new Array(globalGame.turns - 1) 
            : this.compositedFrameDatas = {}
        this.attachBookObserver();
    }
    roundStart() {
        this.fallback = Converter.flowStringToFallback(globalGame.flowString)
        this.username = globalGame.user.nick
    }
    roundEnd(oldPhase: Phase) {
        if (oldPhase != 'book') { return }

        const dlInwindow = new Inwindow("default", { close: true, visible: true })
        const dlIcon = new Image()
        setAttributes(dlIcon, { class: "cellulart-circular-icon", src: getResource("assets/menu-icons/spotlight_on.png") })
        dlIcon.onclick = () => {
            this.compileToGif();  // todo: Memory leak?
        }
        dlInwindow.body.appendChild(dlIcon)
        document.body.appendChild(dlInwindow.element)
        this.compositedFrameDatas = []
    }
    adjustSettings(previous: string, current: string) {
        // We can actually override menuStep to prevent this to begin with.
        // if (this.compositedFrameDatas != []) { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight') }
        if (isNonempty(this.compositedFrameDatas)) { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight') }
    }
    menuStep(): Setting {
        if (isNonempty(this.compositedFrameDatas)) { 
            Console.alert("Changing Spotlight settings mid-album visualization has disastrous consequences - action blocked", 'Spotlight') 
            return this.setting.current
        }

        return super.menuStep()
    }

    // Compiles an array of ImageData into a GIF.
    compileToGif() {
        if (globalGame.turns < 2) { 
            Console.log("Game is too short to form GIF. Cancelling", "Spotlight")
            return
        }  // TODO: Move this check. (?)
        if( this.isSetTo('off') || length(this.compositedFrameDatas) == 0) { return }
        Console.log('Now compiling to GIF', 'Spotlight');
        const gif = gifenc.GIFEncoder();
        
        var index = 0;
        // Console.log(compositedFrameDatas.length, Spotlight)
        while (index < length(this.compositedFrameDatas)) {
            Console.log("Queueing frame " + index, 'Spotlight');
            /*const canvasElement = compositedFrames[index];
            if (canvasElement != null) { gif.addFrame(canvasElement, {delay: 400}) };
            index += 1;*/
            const data = this.compositedFrameDatas[index];
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
        const filename = "Spotlight " + this.username + " " + day + " " + time + ".gif"
        const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");  // Memory leak?
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
    }
    // These four determine when things should fire.
    attachBookObserver() { // [S2]
        var frame = document.querySelector(".timeline")//.previousSibling//.parentElement;
        if (!frame) {
            setTimeout(this.attachBookObserver, 500);
            return
        }
        this.bookObserver.observe(frame, configChildTrunk);// { characterData: true });
    }
    bookObserver = new MutationObserver((records) => {
        console.log("book obse fired; attaching timeline obse"); 
        this.attachTimelineObserver(); 
        this.bookObserver.disconnect();
    })
    attachTimelineObserver() {
        var frame = document.querySelector(".timeline > * > *")  // .childNodes[0].childNodes[0];
        if (!frame) {
            setTimeout(this.attachTimelineObserver, 500);
            return
        }
        this.timelineObserver.observe(frame, configChildTrunk);
    }
    timelineObserver: MutationObserver = new MutationObserver((records) => { // Catch errors when the NEXT button shows up / the next round begins to load
        // console.log("timeline obse fired")
        console.log(records)

        const added = records[0].addedNodes[0]
        if (!(added instanceof HTMLDivElement)) {
            Console.log('End of timeline reached. Beginning frame grabbing', 'Spotlight')
            this.writeResponseFrames()  
        }
    })

    // These functions manage the compositing of timelines into ImageDatas.
    compositeBackgrounds() {
        if (this.isSetTo('off')) { return }
        const canvas = this.initFrom(this.bg)
        const context = canvas.context
        this.drawText(context, "HOSTED BY " + globalGame.host.toUpperCase(), 1206, 82, 50, 400, "M", "white")
        if (this.isSetTo("on")) {
            this.drawName(context, this.username.toUpperCase(), "R") 
            // this.drawPFP(context, '/images/avatar/38.svg', "R") 
            this.drawPFP(context, globalGame.user.avatar, "R")
            // TODO TODO TODO 
        } else {
            Console.alert("Spotlight setting not recognized", 'Spotlight')
        }
        this.canbase = canvas.canvas;
    }
    writeResponseFrames() {
        const timeline = document.querySelector(".timeline")
        if (!timeline) { Console.alert("Could not find timeline", "Spotlight"); return }

        const slides = timeline.querySelectorAll(".item");
        const pairs = this.determineResponseIndices(Array.from(slides))

        for (const indices of pairs) {
            if (indices.key < 0) { Console.log('Did not participate in this round; no frame will be saved', 'Spotlight'); continue }
            if (indices.prev < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); continue } //prevIndex += modeParameters[game.mode]["fallback"] }
            Console.log(`Compositing frame with indices ${indices.key},${indices.prev}`, 'Spotlight')
            this.compositeResponseFrame(Array.from(slides), indices.key, indices.prev)
        }
    }
    determineResponseIndices(slides: Element[]) {
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
            if (this.findUsername(slides[keyIndex]) != this.username) { continue }
            var prevIndex = indexOfPrevSlide(keyIndex)
            // if (keyIndex == prevIndex)
            toReturn.push({ key:keyIndex, prev: prevIndex })
        }
        return toReturn
    }
    compositeResponseFrame(slides: Element[], keyIndex: number, prevIndex: number) {  
        // TODO incorrectly grabbing the same image twice, wtf?
        // todo: What to do if the one being spotlighted has an EMPTY?
        // TODO: Some rounds might loop back to the same person multiple times. (Fixed?)
        if (this.isSetTo('off')) { 
            console.log("hey bozo, it's off")
            return 
        }
        if (!this.canbase) {
            Console.alert("Canbase was not initialized", "Spotlight")
            return
        }
        const canvas = this.initFrom(this.canbase)
        const context = canvas.context

        // const side = this.setting.current == 'on' ? { key:'R', other: 'L' } : { key:'L', other: 'R' }
        const side = { key:'R' as Side, other:'L' as Side }
        const keySlide = slides[keyIndex]
        const prevSlide = slides[prevIndex]
        const prevUser = this.findUsername(prevSlide);
        const prevAvatar = this.findAvatar(prevSlide);

        console.log([side, keySlide, prevSlide, prevUser, prevAvatar])
    
        // Draw everything
        this.drawName(context, prevUser.toUpperCase(), side.other)
        const bottleneck = this.drawPFP(context, prevAvatar, side.other)  // This smells !!!
        this.drawInteraction(context, prevSlide, side.other)
        this.drawInteraction(context, keySlide, side.key)
        this.drawTurnsCounter(context, keyIndex, globalGame.turns - 1)
        // TODO being on a different tab causes image grabs to fail
    
        // Console.log("Almost", 'Spotlight')
        if (bottleneck == "complete") {
                this.compositedFrameDatas[keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data
                // this.preview(canvas.canvas)
            Console.log("Success (Instant)", 'Spotlight')
        } else { 
            bottleneck.addEventListener('load', () => {
                this.compositedFrameDatas[keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data
                // this.preview(canvas.canvas)
            })
            Console.log('Success (Onload)', 'Spotlight')
        }
    }  // [S3]
    findUsername(element: Element): string {
        return (element.querySelector(".nick") ?? element.querySelector("span"))?.textContent ?? "missingno"
    }
    findAvatar(element: Element): string {
        const avatarElement = element.querySelector('.avatar > *')
        if (!avatarElement) {
            Console.alert("Could not find avatar in this element", "Spotlight")
            return ""
        }
        return getComputedStyle(avatarElement).backgroundImage
    }
    
    // Temporary preview function
    // preview(intend) {
    //     const _window = window.open();
    //     _window.document.write('<iframe src="' + intend.toDataURL() + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    // }
        
    // Canvas helper functions
    initFrom(base: CanvasImageSource) {
        const canvas = document.createElement('canvas')
        setAttributes(canvas, { width: "1616px", height: "683px" })
        const context = canvas.getContext('2d')!;
        context.drawImage(base, 0, 0);
        return {canvas: canvas, context: context}
    }

    drawInteraction(context: CanvasRenderingContext2D, slide: Element, side: Side) {
        const canvases = slide.querySelectorAll('canvas')
        if (canvases.length > 0) { 
            for (const canvas of canvases) {
                this.drawDrawing(context, canvas, side) 
            }
        } else { 
            this.drawPrompt(context, slide.querySelector(".balloon")!.textContent, side) 
        }
    }
    drawDrawing(context: CanvasRenderingContext2D, drawing: CanvasImageSource, side: Side) {
        console.log(arguments)
        // console.log(side == "L" ? 33 : 825)
        context.drawImage(drawing, (side == "L" ? 33 : 825), 203);
    }
    drawPrompt(context: CanvasRenderingContext2D, prompt: string | null, side: Side) {
        const startingx = (side == "L" ? 33 : 825)
        context.strokeStyle = "#180454";
        context.lineWidth = 10;
        context.beginPath();
        context.roundRect(startingx, 203, 758, 424, [100]);
        context.stroke();
        context.fillStyle = "white";
        context.beginPath();
        context.roundRect(startingx + 5, 208, 748, 414, [95]);
        context.fill();
    
        this.drawText(context, prompt, (side == "L" ? 412 : 1204), 423, 60, 748, "M", "#180454");
    }
    drawTurnsCounter(context: CanvasRenderingContext2D, elapsed: number, total: number) {
        // console.log(elapsed); console.log(total)
        context.lineWidth = 15;
        
        const barLength = 1560 / total - 10;
        var count = 0
        var startingx = 33
        context.fillStyle = "rgba(255, 255, 255, 1)";
        while (count < elapsed) {
            context.fillRect(startingx, 648, barLength, 16)
            startingx += barLength + 10
            count ++
        }
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        while (count < total) {
            context.fillRect(startingx, 648, barLength, 16)
            startingx += barLength + 10
            count ++
        }
    }

    drawText(
        context: CanvasRenderingContext2D, 
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
        context.font = fontSize + 'px Black';
        var textLength = context.measureText(text).width;

        while (textLength > max) { 
            fontSize -= 5;
            context.font = fontSize + context.font.slice(String(fontSize).length) 
            textLength = context.measureText(text).width;
        }
        
        const borderwidth = fontSize / 4;
        context.lineWidth = borderwidth;

        var startingx = 0;
        switch (justify) {
            case "L": startingx = x + borderwidth / 2; break;
            case "M": startingx = x - context.measureText(text).width / 2; break;
            case "R": startingx = x - context.measureText(text).width - borderwidth / 2; break;
            default: throw new Error("Justify orientation not recognised");
        }
        
        if (internalColor != "#180454") {
            context.strokeStyle = "#180454";
            context.strokeText(text, startingx, y);
        }
        context.fillStyle = internalColor;
        context.fillText(text, startingx, y);
    }
    drawName(context: CanvasRenderingContext2D, name: string, side: Side) {
        var fontSize = 60;
        context.font = fontSize + 'px Black';
        var textLength = context.measureText(name).width;
        
        while (textLength > 500) { 
            fontSize -= 5;
            context.font = fontSize + context.font.slice(String(fontSize).length) 
            textLength = context.measureText(name).width;
        } // const borderwidth = fontSize / 5;

        context.lineWidth = fontSize / 5; // borderwidth;
        const startingx = 
            (side == "L" 
            ? (textLength < 250 ? 430 : 460)
            : (textLength < 250 ? 1186 : 1156)) 
            - context.measureText(name).width / 2 
                
        context.strokeStyle = "#180454";
        context.strokeText(name, startingx, 186);
        context.fillStyle = "#6be4c2";
        context.fillText(name, startingx, 186);
    }
    drawPFP(context: CanvasRenderingContext2D, pfpURL: string, side: Side): "complete"|HTMLImageElement { // todo: An attempt was made to repair tainted canvasses, verify
        const pfp = new Image(); 
        if (pfpURL.includes('custom-avatars-for-gartic-phone')) {
            Console.alert("SillyV's custom avatars extension doesn't work with Spotlight due to CORS reasons. Please ask SillyV to enable CORS on his S3 buckets.", "Spotlight")
            return "complete"
        }
        pfp.setAttribute('crossorigin', 'anonymous'); 
        // pfp.src = pfpURL; 
        if (pfpURL.slice(0,4) == 'url(') {
            pfp.src = pfpURL.slice(5, -2)
        } else {
            pfp.src = pfpURL; 
        }
        console.log(pfp.src)

        if (pfp.complete) {
            context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175) 
        } else {
            pfp.addEventListener('load', () => { 
                context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175) 
            });
        }
        return pfp
    }
}

export { Spotlight }
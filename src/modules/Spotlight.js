import CellulartModule from "./CellulartModule.js";
import {
    WhiteSettingsBelt,
    Console,
    Inwindow,
    setAttributes, configChildTrunk
} from '../foundation'
import SpotlightBase from '../assets/module-assets/spotlight-base.png'
import SpotlightOn from '../assets/menu-icons/spotlight_on.png'
// import gifEncoder2 from "gif-encoder-2";

 /* ----------------------------------------------------------------------
  *                            Spotlight (DOWN)
  * ---------------------------------------------------------------------- */
/** Spotlight condenses your performance for the current round into a gif. 
  * The most spaghetti, convoluted module, second longest at 300 lines.
  * And it's not even particularly useful.                         
  * ---------------------------------------------------------------------- */
const Spotlight = { // [S1]

    name : "Spotlight",
    setting : new WhiteSettingsBelt(), // this one might not be optimizable
    // Spotlight variables
    compositedFrameDatas : [],
    bg : new Image(),   // HTMLImageElement [S1]
    canbase: undefined, // HTMLCanvasElement
    avatars : [],
    names : [],
    // slideNum : -1,
    // keySlideNum : -3,

    username : '',
    fallback : 0,
    
    init(modules) {
        this.bg.src = SpotlightBase;
    },
    mutation(oldPhase, newPhase) {
        if (newPhase == 'start') { return }
        if (newPhase != 'book') { return }
            // if (this.turns == 0) { this.finalizeTurns() }
        //     return
        // }

        // if (game.turns <= 1) { return }
        Console.log(game.host, 'Spotlight')
        Console.log(this.username, 'Spotlight')
        // if (oldPhase == "start") {
        //     // In case you had to reload in the middle of visualization
        //     this.username = (document.querySelector(".users") ?? document.querySelector(".players")).querySelector("i").parentNode.nextSibling.textContent
        // }
        // this.avatars = Array.from(document.querySelectorAll(".avatar")).map(element => window.getComputedStyle(element.childNodes[0]).backgroundImage.slice(5, -2));//.slice(13, -2) );//.slice(29, -2));
        // this.names = Array.from(document.querySelectorAll(".nick")).map(element => element.textContent);

        this.compositeBackgrounds();
        game.turns > 0 
            ? this.compositedFrameDatas = new Array(game.turns - 1) 
            : this.compositedFrameDatas = {}
        Console.log(this.compositedFrameDatas)
        this.attachBookObserver();
    },
    backToLobby(oldPhase) {
        if (oldPhase != 'book') { return }
        if (game.turns >= 1) { this.compileToGif() }  // TODO: Move this check. (?)
        // this.timelineObserver.disconnect()
        // this.avatars = []
        // this.names = []
        // this.turns = 0
    },
    adjustSettings(previous, current) {
        // We can actually override menuStep to prevent this to begin with.
        // if (this.compositedFrameDatas != []) { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight') }
        if (this.compositedFrameDatas.some(x => x)) { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight') }
    },
    roundStart() {
        this.fallback = Converter.flowStringToFallback(game.flow)
        this.username = game.user.nick
    },
    // updateLobbySettings(dict) {
    //     if ('default' in dict) {
    //         this.fallback = Converter.getParameters(dict.default).fallback
    //     } 
    //     if ('custom' in dict) {
    //         this.fallback = Converter.getParameters(dict.custom[1])
    //     }

    //     if ("self" in dict) {
    //         this.username = dict.self.nick
    //     }
    //     // if ("usersIn" in dict) {
    //     //     this.players += dict.usersIn.length
    //     // }
    //     // if ("userOut" in dict) {
    //     //     this.players -= 1
    //     //     // null
    //     // }
    //     // switch (type) {
    //     //     case "default": 
    //     //         break;
    //     //     case "custom":
    //     //         fallback = Converter.flowStringToFallback(data[1])
    //     //         break;
    //     //     // case 2: Timer.parameters.players += 1; break;
    //     //     // case 3: Timer.parameters.players -= 1; break;
    //     //     // case 5: Timer.finalizeTurns(); break;
    //     //     // case 18: Timer.tweakParameters(data); break;
    //     //     // case 26: Timer.templateParameters(data); break;
    //     // }
    //     // switch (type) {
    //     //     case 1: 
    //     //         this.username = data.user.nick; 
    //     //         this.host = data.users[0].nick;
    //     //         this.fallback = Converter.flowStringToFallback(Converter.flowIndexToString(data.configs.first))
        
    //     //         // this.players = data.users.length;
    //     //         if (data.turnMax > 0) { this.turns = data.turnMax }
    //     //         break;
    //     //     // case 2: this.players += 1; break;
    //     //     // case 3: this.players -= 1; break;
    //     //     // case 5: 
    //     //     //     this.finalizeTurns(); break;
    //     //     case 9:
    //     //         if (Object.keys(data).length > 0) { break } else { this.writeResponseFrames() }
    //     //     // Spotlight can be a bit looser on its turn tracking, so we do just that.
    //     // }
    // },

    // finalizeTurns(players) {
    //     const t = this.parameters.turns; if (t instanceof Function) { this.parameters.turns = t(players) }
    // },

    // Compiles an array of ImageData into a GIF.
    compileToGif() {
        if( this.isSetTo('off') || this.compositedFrameDatas.length == 0) { return }
        Console.log('Now compiling to GIF', 'Spotlight');
        const gif = gifenc.GIFEncoder();
        
        var index = 0;
        // Console.log(compositedFrameDatas.length, Spotlight)
        while (index < this.compositedFrameDatas.length) {
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
        function download (buf, filename, type) {
            const blob = buf instanceof Blob ? buf : new Blob([buf], { type });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
        }

        const dlnode = Inwindow.new(true, true)
        const dlicon = setAttributes(new Image(), { class: "cellulart-circular-icon", src: SpotlightOn })
        dlicon.onclick = function() {
            download(buffer, filename, { type: 'image/gif' });
            dlnode.element.remove();  // todo: Memory leak?
        }
        dlnode.body.appendChild(dlicon)
        document.body.appendChild(dlnode.element)
    },
    // These four determine when things should fire.
    attachBookObserver() { // [S2]
        var frame = document.querySelector(".timeline")//.previousSibling//.parentElement;
        if (!frame) {
            setTimeout(Spotlight.attachBookObserver, 500);
            return
        }
        Spotlight.bookObserver.observe(frame, configChildTrunk);// { characterData: true });
    },
    bookObserver : new MutationObserver((records) => {
        console.log("timline obse fired; attaching book obse"); 
        Spotlight.attachTimelineObserver(); 
        Spotlight.bookObserver.disconnect();
    }),
    attachTimelineObserver() {
        var frame = document.querySelector(".timeline").childNodes[0].childNodes[0];
        if (!frame) {
            setTimeout(Spotlight.attachTimelineObserver, 500);
            return
        }
        Spotlight.timelineObserver.observe(frame, configChildTrunk);
    },
    timelineObserver : new MutationObserver((records) => { // Catch errors when the NEXT button shows up / the next round begins to load
        // console.log("book obse fired")
        console.log(records)
        // if (records[0].addedNodes.find((x) => !(x instanceof HTMLDivElement))) {
        //     console.log('hmm, i think we should composite')
        //     Spotlight.compositeResponseFrame()
        // }
        const added = records[0].addedNodes[0]
        if (!(added instanceof HTMLDivElement)) {
            Console.log('End of timeline reached. Beginning frame grabbing', 'Spotlight')
            Spotlight.writeResponseFrames()  
        }
        // }
        // if (records[0].removedNodes.length > 0) {
        //     console.log("New timeline entered; resetting slideNums")
        //     // Spotlight.slideNum = -1;
        //     // Spotlight.keySlideNum = -2;
        //     return;
        // }
        // // what if an EMPTY response? Sometimes backtrack two steps, sometimes one. Hence modeParameters now has fallback values.
        // this.slideNum += 1
        // const currentSlide = records[0].addedNodes[0];
        // if ((currentSlide.querySelector(".nick") ?? currentSlide.querySelector("span")).textContent == this.username) {
        //     this.keySlideNum = this.slideNum
        // } else if (this.slideNum == this.turns) {//currentSlide.querySelector(".download") != null) {
        //     // console.log("Stepped over. Compositing response")
        //     this.compositeResponseFrame()
        // }
    }),

    // These functions manage the compositing of timelines into ImageDatas.
    compositeBackgrounds() {
        if (this.isSetTo('off')) { return }
        const canvas = this.initFrom(this.bg)
        const context = canvas.context
        this.drawText(context, "HOSTED BY " + game.host.toUpperCase(), 1206, 82, 50, 400, "M", "white")
        switch (this.setting.current) {
            case 'on':
                this.drawName(context, this.username.toUpperCase(), "R") 
                // this.drawPFP(context, '/images/avatar/38.svg', "R") 
                this.drawPFP(context, game.user.avatar, "R")
                // TODO TODO TODO 
                break;
            // case 1:
            //     this.drawName(context, this.username.toUpperCase(), "L") 
            //     this.drawPFP(context, this.avatars[this.names.indexOf(this.username)], "L")
            //     break;
            default:
                Console.alert("Spotlight setting not recognized", 'Spotlight')
        }
        // intendurl = canvas;
        // setTimeout(preview, 1000)
        this.canbase = canvas.canvas;
    },
    writeResponseFrames() {
        const slides = document.querySelector(".timeline").querySelectorAll(".item");
        const pairs = this.determineResponseIndices(slides)

        for (const indices of pairs) {
            if (indices.key < 0) { Console.log('Did not participate in this round; no frame will be saved', 'Spotlight'); continue }
            if (indices.prev < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); continue } //prevIndex += modeParameters[game.mode]["fallback"] }
            Console.log(`Compositing frame with indices ${indices.key},${indices.prev}`, 'Spotlight')
            this.compositeResponseFrame(slides, indices.key, indices.prev)
        }
    },
    determineResponseIndices(slides) {
        var toReturn = []
        for (var keyIndex = 1; keyIndex < slides.length; keyIndex++) {
            if (this.findUsername(slides[keyIndex]) != this.username) { continue }
            var prevIndex = indexOfPrevSlide(keyIndex)
            // if (keyIndex == prevIndex)
            toReturn.push({ key:keyIndex, prev: prevIndex })
        }
        return toReturn
        // const keyIndex = slides.find((item) => findUsername(item) == this.username)
        // if (keySlide < 0) { Console.log('Did not participate in this round; no frame will be saved') }
        // const keySlide = slides[keyIndex]  // slides[this.keyIndex]
        // var prevIndex = indexOfPrevSlide(keySlide)
        // if (prevIndex < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); return } //prevIndex += modeParameters[game.mode]["fallback"] }
        // const prevSlide = slides[prevIndex]
        // const prevUser = findUsername(prevSlide);
        // return { key:keyIndex, prev: prevIndex }

        function indexOfPrevSlide(key) {
            var i = this.fallback > 0 ? key - 1 : 0; 
            /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
            while (i >= 0 && slides[i].querySelector(".empty") != null) { 
                i -= this.fallback; 
                Console.log(`Could not find prompt frame, falling back by ${this.fallback}`, 'Spotlight')
            }
            return i
        }
    },
    compositeResponseFrame(slides, keyIndex, prevIndex) {  
        // TODO incorrectly grabbing the same image twice, wtf?
        // todo: What to do if the one being spotlighted has an EMPTY?
        // TODO: Some rounds might loop back to the same person multiple times. (Fixed?)
        if (this.isSetTo('off')) { 
            console.log("hey bozo, it's off")
            return 
        }
        const canvas = this.initFrom(this.canbase)
        const context = canvas.context

        // const side = this.setting.current == 'on' ? { key:'R', other: 'L' } : { key:'L', other: 'R' }
        const side = { key:'R', other:'L' }
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
        this.drawTurnsCounter(context, this.keyIndex, game.turns - 1)
        // TODO being on a different tab causes image grabs to fail
    
        // Console.log("Almost", 'Spotlight')
        // setTimeout(this.preview, 500, canvas.canvas) // Temporary
        if (bottleneck.complete) {
            // setTimeout(() => { 
                Spotlight.compositedFrameDatas[keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data
                Spotlight.preview(canvas.canvas)
            // }, 100)
            Console.log("Success (Instant)", 'Spotlight')
        } else { 
            bottleneck.addEventListener('load', () => {
                Spotlight.compositedFrameDatas[keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data
                Spotlight.preview(canvas.canvas)
            })
            Console.log('Success (Onload)', 'Spotlight')
        }
        // ;(() => { const b = bottleneck.onload; bottleneck.onload = () => { b(); Spotlight.compositedFrameDatas[keyIndex] = context.getImageData(0, 0, 1616, 683).data }})()  // This stinks to high heaven!
        // setTimeout(function() { this.compositedFrameDatas[this.keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data }, 200) // TODO: Horrendously bad bodged solution to the pfp not yet being loaded
        // prevAvatar
        // function indexOfPrevSlide(key) {
        //     var i = this.fallback > 0 ? key - 1 : 0; 
        //     /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
        //     while (i >= 0 && slides[i].querySelector(".empty") != null) { 
        //         i -= this.fallback; 
        //         Console.log(`Could not find prompt frame, falling back by ${this.fallback}`, 'Spotlight')
        //     }
        //     return i
        // }
    }, // [S3]
    findUsername(element) {
        return (element.querySelector(".nick") ?? element.querySelector("span")).textContent
    },
    findAvatar(element) {
        return getComputedStyle(element.querySelector('.avatar').firstChild).backgroundImage
    },
    
    // Temporary preview function
    preview(intend) {
        const _window = window.open();
        _window.document.write('<iframe src="' + intend.toDataURL() + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    },
        
    // Canvas helper functions
    initFrom(base) {
        const canvas = setAttributes(document.createElement('canvas'), { width: "1616px", height: "683px" })
        const context = canvas.getContext('2d');
        context.drawImage(base, 0, 0);
        return {canvas: canvas, context: context}
    },

    drawInteraction(context, slide, side) {
        const canvases = slide.querySelectorAll('canvas')
        if (canvases.length > 0) { 
            for (const canvas of canvases) {
                this.drawDrawing(context, canvas, side) 
            }
        } else { 
            this.drawPrompt(context, slide.querySelector(".balloon").textContent, side) 
        }
    },
    drawDrawing(context, drawing, side) {
        console.log(arguments)
        // console.log(side == "L" ? 33 : 825)
        context.drawImage(drawing, (side == "L" ? 33 : 825), 203);
    },
    drawPrompt(context, prompt, side) {
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
    },
    drawTurnsCounter(context, elapsed, total) {
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
    },

    drawText(context, text, x, y, size, max, justify, internalColor) {
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
    },
    drawName(context, name, side) {
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
    },
    drawPFP(context, pfpURL, side) { // todo: An attempt was made to repair tainted canvasses, verify
        const pfp = new Image(); 
        if (pfpURL.includes('custom-avatars-for-gartic-phone')) {
            Console.alert("SillyV's custom avatars extension doesn't work with Spotlight due to CORS reasons. Please ask SillyV to enable CORS on his S3 buckets.")
            return { complete:true }
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
    },
}
Object.setPrototypeOf(Spotlight, CellulartModule)

export default Spotlight
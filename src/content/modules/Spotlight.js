
import CellulartModule from "./CellulartModule";
import { spotlight_base } from './module-assets'
import { spotlight_on } from './menu-icons'
import { 
    Console,
    Converter,
    Inwindow,
    WhiteSettingsBelt,
    setAttributes } from '../foundation.js'
import * as gifenc from 'gifenc'

/* ----------------------------------------------------------------------
 *                            Spotlight (DOWN)
 * ---------------------------------------------------------------------- */
/** Spotlight condenses your performance for the current round into a gif.
  * The most spaghetti, convoluted module, second longest at 300 lines.
  * And it's not even particularly useful.
  * Down for maintenance.
  * ---------------------------------------------------------------------- */
const Spotlight = {
    name: "Spotlight",
    setting: new WhiteSettingsBelt(), // this one might not be optimizable

    // Spotlight variables
    compositedFrameDatas: [],
    bg: new Image(), // HTMLImageElement [S1]
    canbase: undefined, // HTMLCanvasElement
    avatars: [],
    names: [],
    // slideNum : -1,
    // keySlideNum : -3,
    host: '',
    user: '',
    turns: 0,
    fallback: 0,

    init(modules) {
        Spotlight.bg.src = spotlight_base;
    },
    mutation(oldPhase, newPhase) {
        if (newPhase == 'start') { return; }
        if (newPhase != 'book') {
            if (Spotlight.turns == 0) {
                setTimeout(() => {
                    const indicator = document.querySelector('.step').querySelector('p').textContent;
                    Spotlight.turns = Number(indicator.slice(indicator.indexOf('/') + 1));
                }, 200);
            }
            return;
        }
        if (Spotlight.turns <= 1) { return; }
        // if (oldPhase == "start") {
        //     // In case you had to reload in the middle of visualization
        //     Spotlight.user = (document.querySelector(".users") ?? document.querySelector(".players")).querySelector("i").parentNode.nextSibling.textContent
        // }
        // Spotlight.avatars = Array.from(document.querySelectorAll(".avatar")).map(element => window.getComputedStyle(element.childNodes[0]).backgroundImage.slice(5, -2));//.slice(13, -2) );//.slice(29, -2));
        // Spotlight.names = Array.from(document.querySelectorAll(".nick")).map(element => element.textContent);
        Spotlight.compositeBackgrounds();
        Spotlight.turns > 0
            ? Spotlight.compositedFrameDatas = new Array(Spotlight.turns - 1)
            : Spotlight.compositedFrameDatas = {};

        // Spotlight.attachBookObserver();
    },
    backToLobby(oldPhase) {
        if (oldPhase != 'book') { return; }
        if (Spotlight.turns > 1) { Spotlight.compileToGif(); }
        // Spotlight.timelineObserver.disconnect()
        // Spotlight.avatars = []
        // Spotlight.names = []
        Spotlight.turns = 0;
    },
    adjustSettings(previous, current) {
        // We can actually override menuStep to prevent this to begin with.
        if (Spotlight.compositedFrameDatas != []) { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight'); }
    },
    update42(type, data) {
        switch (type) {
            case 1:
                Spotlight.user = data.user.nick;
                Spotlight.host = data.users[0].nick;
                Spotlight.fallback = Converter.flowStringToFallback(Converter.flowIndexToString(data.configs.first));

                // Spotlight.players = data.users.length;
                if (data.turnMax > 0) { Spotlight.turns = data.turnMax; }
                break;
            // case 2: Spotlight.players += 1; break;
            // case 3: Spotlight.players -= 1; break;
            // case 5: 
            //     Spotlight.finalizeTurns(); break;
            case 9:
                if (Object.keys(data).length > 0) { break; } else { Spotlight.writeResponseFrames(); }
            // Spotlight can be a bit looser on its turn tracking, so we do just that.
        }
    },

    // finalizeTurns(players) {
    //     const t = Spotlight.parameters.turns; if (t instanceof Function) { Spotlight.parameters.turns = t(players) }
    // },
    // Compiles an array of ImageData into a GIF.
    compileToGif() {
        if (Spotlight.setting.current() == 'off' || Spotlight.compositedFrameDatas.length == 0) { return; }
        Console.log('Now compiling to GIF', 'Spotlight');
        const gif = gifenc.GIFEncoder();

        var index = 0;
        // Console.log(compositedFrameDatas.length, Spotlight)
        while (index < Spotlight.compositedFrameDatas.length) {
            Console.log("Queueing frame " + index, 'Spotlight');
            /*const canvasElement = compositedFrames[index];
            if (canvasElement != null) { gif.addFrame(canvasElement, {delay: 400}) };
            index += 1;*/
            const data = Spotlight.compositedFrameDatas[index];
            index += 1;
            if (!data) { continue; }
            const format = "rgb444";
            const palette = gifenc.quantize(data, 256, { format });
            const indexed = gifenc.applyPalette(data, palette, format);
            gif.writeFrame(indexed, 1616, 683, { palette });
        }

        Console.log('Complete', 'Spotlight');
        gif.finish();
        const buffer = gif.bytesView();

        const today = new Date();
        const day = today.getDate() + "-" + (today.getMonth() + 1) + '-' + today.getFullYear();
        const time = today.getHours() + ":" + today.getMinutes();
        const filename = "Spotlight " + Spotlight.user + " " + day + " " + time + ".gif";
        function download(buf, filename, type) {
            const blob = buf instanceof Blob ? buf : new Blob([buf], { type });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
        }

        const dlnode = Inwindow.new(true, true);
        const dlicon = setAttributes(new Image(), { class: "cellulart-circular-icon", src: spotlight_on });
        dlicon.onclick = function () {
            download(buffer, filename, { type: 'image/gif' });
            dlnode.remove();
        };
        dlnode.body.appendChild(dlicon);
        document.body.appendChild(dlnode);
    },
    // These four determine when things should fire.
    // attachBookObserver() { // [S2]
    //     var frame = document.querySelector(".timeline")//.previousSibling//.parentElement;
    //     if (!frame) {
    //         setTimeout(Spotlight.attachBookObserver, 500);
    //         return
    //     }
    //     Spotlight.bookObserver.observe(frame, configChildTrunk);// { characterData: true });
    // },
    // bookObserver : new MutationObserver(() => {
    //     // console.log("timline obse fired; attaching book obse"); 
    //     Spotlight.attachTimelineObserver(); 
    //     Spotlight.bookObserver.disconnect();
    // }),
    // attachTimelineObserver() {
    //     var frame = document.querySelector(".timeline").childNodes[0].childNodes[0];
    //     if (!frame) {
    //         setTimeout(Spotlight.attachTimelineObserver, 500);
    //         return
    //     }
    //     Spotlight.timelineObserver.observe(frame, configChildTrunk);
    // },
    // timelineObserver : new MutationObserver((records) => { // Catch errors when the NEXT button shows up / the next round begins to load
    //     // console.log("book obse fired")
    //     if (records[0].removedNodes.length > 0) {
    //         // console.log("New timeline entered; resetting slideNums")
    //         Spotlight.slideNum = -1;
    //         Spotlight.keySlideNum = -2;
    //         return;
    //     }
    //     // what if an EMPTY response? Sometimes backtrack two steps, sometimes one. Hence modeParameters now has fallback values.
    //     Spotlight.slideNum += 1
    //     const currentSlide = records[0].addedNodes[0];
    //     if ((currentSlide.querySelector(".nick") ?? currentSlide.querySelector("span")).textContent == Spotlight.user) {
    //         Spotlight.keySlideNum = Spotlight.slideNum
    //     } else if (Spotlight.slideNum == Spotlight.turns) {//currentSlide.querySelector(".download") != null) {
    //         // console.log("Stepped over. Compositing response")
    //         Spotlight.compositeResponseFrame()
    //     }
    // }),
    // These functions manage the compositing of timelines into ImageDatas.
    compositeBackgrounds() {
        if (Spotlight.setting.current() == 'off') { return; }
        const canvas = Spotlight.initFrom(Spotlight.bg);
        const context = canvas.context;
        Spotlight.drawText(context, "HOSTED BY " + Spotlight.host.toUpperCase(), 1206, 82, 50, 400, "M", "white");
        switch (Spotlight.setting.current()) {
            case 'on':
                Spotlight.drawName(context, Spotlight.user.toUpperCase(), "R");
                // Spotlight.drawPFP(context, Spotlight.avatars[Spotlight.names.indexOf(Spotlight.user)], "R")
                // TODO TODO TODO 
                break;
            // case 1:
            //     Spotlight.drawName(context, Spotlight.user.toUpperCase(), "L") 
            //     Spotlight.drawPFP(context, Spotlight.avatars[Spotlight.names.indexOf(Spotlight.user)], "L")
            //     break;
            default:
                Console.alert("Spotlight setting not recognized", 'Spotlight');
        }
        // intendurl = canvas;
        // setTimeout(preview, 1000)
        Spotlight.canbase = canvas.canvas;
    },
    writeResponseFrames() {
        var pairs = Spotlight.determineResponseIndices();

        for (const indices of pairs) {
            if (indices.key < 0) { Console.log('Did not participate in this round; no frame will be saved'); continue; }
            if (indices.prev < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); continue; } //prevIndex += modeParameters[game.mode]["fallback"] }
            Spotlight.compositeResponseFrame(indices.key, indices.prev);
        }
    },
    determineResponseIndices() {
        const slides = document.querySelector(".timeline").querySelectorAll(".item");
        var toReturn = [];
        for (var keyIndex = 0; keyIndex < slides.length; keyIndex++) {
            if (Spotlight.findUsername(slides[keyIndex]) != Spotlight.user) { continue; }
            var prevIndex = indexOfPrevSlide(keyIndex);
            toReturn.push({ key: keyIndex, prev: prevIndex });
        }
        return toReturn;
        // const keyIndex = slides.find((item) => findUsername(item) == Spotlight.user)
        // if (keySlide < 0) { Console.log('Did not participate in this round; no frame will be saved') }
        // const keySlide = slides[keyIndex]  // slides[Spotlight.keyIndex]
        // var prevIndex = indexOfPrevSlide(keySlide)
        // if (prevIndex < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); return } //prevIndex += modeParameters[game.mode]["fallback"] }
        // const prevSlide = slides[prevIndex]
        // const prevUser = findUsername(prevSlide);
        // return { key:keyIndex, prev: prevIndex }
        function indexOfPrevSlide(key) {
            var i = Spotlight.fallback > 0 ? key - 1 : 0;
            /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
            while (i >= 0 && slides[i].querySelector(".empty") != null) {
                i -= Spotlight.fallback;
                Console.log(`Could not find prompt frame, falling back by ${Spotlight.fallback}`, 'Spotlight');
            }
            return i;
        }
    },
    compositeResponseFrame(keyIndex, prevIndex) {
        // todo: What to do if the one being spotlighted has an EMPTY?
        // TODO: Some rounds might loop back to the same person multiple times.
        if (Spotlight.setting.current() == 'off') { return; }
        const canvas = Spotlight.initFrom(Spotlight.canbase);
        const context = canvas.context;

        // const side = Spotlight.setting.current() == 'on' ? { key:'R', other: 'L' } : { key:'L', other: 'R' }
        const side = { key: 'R', other: 'L' };

        // Determinine slides
        // const slides = document.querySelector(".timeline").querySelectorAll(".item");
        // const keyIndex = slides.find((item) => findUsername(item) == Spotlight.user)
        // if (keyIndex < 0) { Console.log('Did not participate in this round; no frame will be saved') }
        const keySlide = Spotlight.slides[keyIndex]; // slides[Spotlight.keyIndex]


        // var prevIndex = indexOfPrevSlide(keySlide)
        // if (prevIndex < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); return } //prevIndex += modeParameters[game.mode]["fallback"] }
        const prevSlide = Spotlight.slides[prevIndex];
        const prevUser = Spotlight.findUsername(prevSlide);
        // const prevAvatar = Spotlight.avatars[Spotlight.names.indexOf(prevUser)]
        const prevAvatar = prevSlide.querySelector('avatar').firstChild.style.backgroundImage;

        // Draw everything
        Spotlight.drawName(context, prevUser.toUpperCase(), side.other);
        const bottleneck = Spotlight.drawPFP(context, prevAvatar, side.other); // This smells !!!
        try { Spotlight.drawDrawing(context, prevSlide.querySelector("canvas"), side.other); } catch { Spotlight.drawPrompt(context, prevSlide.querySelector(".balloon").textContent, side.other); }
        try { Spotlight.drawDrawing(context, keySlide.querySelector("canvas"), side.key); } catch { Spotlight.drawPrompt(context, keySlide.querySelector(".balloon").textContent, side.key); }
        Spotlight.drawTurnsCounter(context, Spotlight.keyIndex, Spotlight.turns - 1);
        // TODO being on a different tab causes image grabs to fail
        // setTimeout(Spotlight.preview, 500, canvas.canvas) // Temporary
        (() => { const b = bottleneck.onload; bottleneck.onload = () => { b(); Spotlight.compositedFrameDatas[Spotlight.keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data; }; })(); // This stinks to high heaven!












        // setTimeout(function() { Spotlight.compositedFrameDatas[Spotlight.keyIndex - 1] = context.getImageData(0, 0, 1616, 683).data }, 200) // TODO: Horrendously bad bodged solution to the pfp not yet being loaded
        // prevAvatar
        // function indexOfPrevSlide(key) {
        //     var i = Spotlight.fallback > 0 ? key - 1 : 0; 
        //     /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
        //     while (i >= 0 && slides[i].querySelector(".empty") != null) { 
        //         i -= Spotlight.fallback; 
        //         Console.log(`Could not find prompt frame, falling back by ${Spotlight.fallback}`, 'Spotlight')
        //     }
        //     return i
        // }
    }, // [S3]
    findUsername(element) {
        return (element.querySelector(".nick") ?? element.querySelector("span")).textContent;
    },

    // Temporary preview function
    preview(intend) {
        const _window = window.open();
        _window.document.write('<iframe src="' + intend.toDataURL() + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    },

    // Canvas helper functions
    initFrom(base) {
        const canvas = setAttributes(document.createElement('canvas'), { width: "1616px", height: "683px" });
        const context = canvas.getContext('2d');
        context.drawImage(base, 0, 0);
        return { canvas: canvas, context: context };
    },

    drawDrawing(context, drawing, side) {
        context.drawImage(drawing, (side == "L" ? 33 : 825), 203);
    },
    drawPrompt(context, prompt, side) {
        const startingx = (side == "L" ? 33 : 825);
        context.strokeStyle = "#180454";
        context.lineWidth = 10;
        context.beginPath();
        context.roundRect(startingx, 203, 758, 424, [100]);
        context.stroke();
        context.fillStyle = "white";
        context.beginPath();
        context.roundRect(startingx + 5, 208, 748, 414, [95]);
        context.fill();

        Spotlight.drawText(context, prompt, (side == "L" ? 412 : 1204), 423, 60, 748, "M", "#180454");
    },
    drawTurnsCounter(context, elapsed, total) {
        // console.log(elapsed); console.log(total)
        context.lineWidth = 15;

        const barLength = 1560 / total - 10;
        var count = 0;
        var startingx = 33;
        context.fillStyle = "rgba(255, 255, 255, 1)";
        while (count < elapsed) {
            context.fillRect(startingx, 648, barLength, 16);
            startingx += barLength + 10;
            count++;
        }
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        while (count < total) {
            context.fillRect(startingx, 648, barLength, 16);
            startingx += barLength + 10;
            count++;
        }
    },

    drawText(context, text, x, y, size, max, justify, internalColor) {
        var fontSize = size;
        context.font = fontSize + 'px Black';
        var textLength = context.measureText(text).width;

        while (textLength > max) {
            fontSize -= 5;
            context.font = fontSize + context.font.slice(String(fontSize).length);
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
            context.font = fontSize + context.font.slice(String(fontSize).length);
            textLength = context.measureText(name).width;
        } // const borderwidth = fontSize / 5;

        context.lineWidth = fontSize / 5; // borderwidth;
        const startingx = (side == "L"
            ? (textLength < 250 ? 430 : 460)
            : (textLength < 250 ? 1186 : 1156))
            - context.measureText(name).width / 2;

        context.strokeStyle = "#180454";
        context.strokeText(name, startingx, 186);
        context.fillStyle = "#6be4c2";
        context.fillText(name, startingx, 186);
    },
    drawPFP(context, pfpURL, side) {
        const pfp = new Image(); pfp.setAttribute('crossorigin', 'anonymous'); pfp.src = pfpURL; pfp.onload = function () {
            context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175);
        };
        return pfp;
    },
};
Object.setPrototypeOf(Spotlight, CellulartModule)

export default Spotlight



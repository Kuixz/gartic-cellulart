// import { Socket, preventDefaults, clamp, gifenc, WhiteSettingsBelt, RedSettingsBelt, SettingsBelt, Console, Inwindow, setAttributes, svgNS, getResource, Converter, Keybind } from 'bleh'



///////////////////////////// #region Minimodules /////////////////////////////

/* ----------------------------------------------------------------------
  *                                 Debug 
  * ---------------------------------------------------------------------- */
/** Debug routes or blocks console messages.
  * Works closely with Console; the two should be merged into one.
  * ---------------------------------------------------------------------- */
const Debug = {
    name : "Debug",
    setting : new WhiteSettingsBelt(),    

    debugWIW : undefined,

    init(modules) {
        const debugWIW = Inwindow.new(false, false, 0.2)
        const body = setAttributes(debugWIW.body, { id:"debug-body" });
        const iconSelect = setAttributes(document.createElement("div"), { id: 'debug-header', parent: body })

        // const preactivated = [ Observer ]
        modules.map(mod => mod.name).concat(["Socket", "Xhr", "Worker", "Observer"]).forEach((mod) => {
            const modIcon = setAttributes(document.createElement("img"), { class: "cellulart-circular-icon", src: getResource("assets/menu-icons/" + mod.toLowerCase() + "_on" + ".png"), parent: iconSelect })
            modIcon.addEventListener("click", toggle)
            if (Console.enabled.has(mod)) { 
                modIcon.classList.add("debug-selected")
            }
            function toggle() {
                modIcon.classList.toggle("debug-selected")
                Console.toggle(mod)
            }
        }) 

        Debug.debugWIW = debugWIW;
    },
    adjustSettings(previous, current) {
        if (current == 'on') { 
            Debug.debugWIW.setVisibility('initial'); return 
        }
        Debug.debugWIW.setVisibility('hidden')
    },
}; 
Object.setPrototypeOf(Debug, CellulartModule)



/* ----------------------------------------------------------------------
  *                                  Red 
  * ---------------------------------------------------------------------- */
/** Red controls the "cheat activation" status of the other modules.
  * A plain and simple 10-line minimodule that 
  * barely adds anything of its own to the CellulartModule framework.
  * ---------------------------------------------------------------------- */
const Red = {
    name : "Red",
    isCheat : true,
    setting : new SettingsBelt(['on', 'red']),

    modules : null,

    init(modules) { 
        this.modules = modules.filter((x) => 'setting' in x ) 
        // console.log(this.modules)
    },
    adjustSettings(previous, current) {
        this.modules.forEach((mod) => { mod.togglePlus(current == 'red') })
    },
    // saveRecurrentState() { return { setting: this.setting.current } }
    // saveTransientState() { return {} },
}; 
Object.setPrototypeOf(Red, CellulartModule)

// #endregion



/////////////////////////////// #region Modules ///////////////////////////////

/* ----------------------------------------------------------------------
  *                                 Timer 
  * ---------------------------------------------------------------------- */
/** Timer adds a digital timer displaying time remaining (or elapsed) 
  * in the top right corner, just under the analog clock.              
  * ---------------------------------------------------------------------- */
const Timer = {
   
    name : "Timer",
    setting : new WhiteSettingsBelt('on'),
    // Timer variables 
    display : undefined, // HTMLDivElement
    countdown : undefined, // timeoutID

    write: 40,             // used by Timer
    draw: 150,             // used by Timer
    decay: 0,              // used by Timer
    // decayFunction: () => 0,
    firstMultiplier: 1.25, // used by Timer

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (["book", "start"].includes(newPhase)) { return }
        if (game.turns == 0) { this.finalizeTurns() }
        setTimeout(() => { this.placeTimer() }, 200)

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        clearTimeout(this.countdown)
        setTimeout((x) => { this.restartTimer(x) }, 200, newPhase)
    },
    backToLobby(oldPhase) {
        // this.turns = 0
    }, // Empty.
    adjustSettings(previous, current) {
        if (this.display == undefined) { return }
        if (current == "on") { this.display.style.visibility = "visible" } else { this.display.style.visibility = "hidden" }
    },
    roundStart() {
        // const data = dict.custom
        const parameters = Converter.speedStringToParameters(game.speedString)
        this.decay = parameters.decayFunction(game.turns)
        // delete parameters.turns
        Object.assign(this, parameters)  // TODO: unsafe and unscalable
    },
    // updateLobbySettings(dict) {
    //     if ("default" in dict) {
    //         const data = dict.default
    //         const parameters = Converter.getParameters(data)
    //         Object.assign(this, parameters)  // TODO: unsafe and unscalable
    //         // console.log(g)
    //     }
    //     if ("custom" in dict) {
    //         const data = dict.custom
    //         // const players = "players" in dict ? dict.players : 1
    //         // this.turnsFunction = Converter.turnsStringToFunction(data[2]) // (players) 
    //         const parameters = Converter.speedStringToParameters(data[0])
    //         Object.assign(this, parameters)  // TODO: unsafe and unscalable
    //     }
    // },

    // templateParameters(data) {
    //     Object.assign(this.parameters, Converter.getParameters(Converter.modeIndexToString(data)))
    // },
    // adjustParameters(parameters) {
    //     const config = parameters.configs
    //     // const midgame = parameters.turnMax > 0

    //     // Timer.parameters.players = parameters.users.length;
    //     if ('speed' in config) { Object.assign(this, Converter.speedStringToParameters(Converter.speedIndexToString(config.speed))) }  // TODO: unsafe and unscalable
    //     // Timer.tweakParameters(config, midgame)

    //     if (parameters.turnMax > 0) {
    //     // if (midgame) {
    //         // todo: in theory we should pass these through to all the modules, but ehh.
    //         // Timer.parameters.turns = parameters.turnMax
    //         Timer.interpolate(parameters.turnNum)
    //         // Timer.finalizeTurns(Timer.parameters.players)
    //     }
    // },
    // tweakParameters(config, midgame=false) {
    //     // if ('turns' in config) { Timer.parameters.turnsFunction = midgame ? () => { return parameters.turnMax } : Converter.turnsStringToFunction(Converter.turnsIndexToString(config.turns)) }  // (players) 
    //     if ('speed' in config) { Object.assign(this.parameters, Converter.speedStringToParameters(Converter.speedIndexToString(config.speed))) }
    // },
    // finalizeTurns() {
    //     const step = document.querySelector('.step')
    //     if (!step) { setTimeout(() => { this.finalizeTurns() }, 200)}
    //     // if (newPhase != 'book') { 
    //         // setTimeout(() => {
    //         // if (this.parameters.turns == 0) { 
    //     // const d = this.parameters.turns; if (t 
    //     const indicator = step.querySelector('p').textContent
    //     this.turns = Number(indicator.slice(indicator.indexOf('/') + 1))
            
    //         // }
    //         // return
    //     // }
    // // finalizeTurns(players) {
    //     // const t = Timer.parameters.turns; if (t instanceof Function) { Timer.parameters.turns = t(players) }
    //     this.decay = this.decayFunction(this.turns)
    //     // }, 200);
    // },

    placeTimer() {  // [T3]
        // const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }

        // todo: is it even possible to run a rescue scheme, given that we pluck the clock and stick it in the holder?
        const clock = document.querySelector(".time");

        const holder = setAttributes(document.createElement("div"), { id: "clocksticles" })
        clock.insertAdjacentElement("beforebegin", holder) // These two lines
        holder.appendChild(clock)                          // finesse the clock into its holder.

        const timerHolder = setAttributes(document.createElement("div"), { id: "timerHolder", parent: holder })

        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))
        this.display = setAttributes(document.createElement("div"), { id: "timer", style: `visibility:${this.isSetTo('off') ? "hidden" : "visible"}`, parent: timerHolder })

        const p = clock.querySelector('p'); if (p) { p.style.visibility = "hidden" }
    },
    restartTimer(newPhase) {
        const clock = document.querySelector(".time")
        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if(p) { p.style.visibility = "hidden" } // Prevents clashing with SillyV's extension
            this.tick(1, 1)
        } else {
            var seconds = this.getSecondsForPhase(newPhase)
            if (seconds == -1) {
                this.tick(1, 1)
            }
            else {
                this.tick(seconds - 1, -1)
            }
        }
        // if (game.parameters["timerCurve"] != 0) { 
        this.interpolate(1); 
        // }
    },
    getSecondsForPhase(newPhase) {
        Console.log("I think this phase is " + newPhase, 'Timer');
        var toReturn = 0;
        switch (newPhase) {
            case 'draw': case 'memory': 
                // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST
                if (![1,1.25].includes(this.firstMultiplier) && document.querySelector(".step").textContent.slice(0, 2) == "1/") {
                    toReturn = 150 * this.firstMultiplier;  // Experimental optimization replacing this.draw with flat 150
                } else { 
                    toReturn = this.draw;
                } break;
            case 'write': toReturn = this.write; break;
            case 'first': toReturn = this.write * this.firstMultiplier; break;
            case 'mod':   return 25 // 10 // [T2]
            default:
                Console.alert("Could not determine duration of phase " + newPhase, 'Timer')
                return 0
        }
        return Math.floor(toReturn)
    },
    tick(seconds, direction) {
        const h = String(Math.floor(seconds / 3600)) + ":"
        const m = String(Math.floor(seconds / 60)) + ":"
        var s = String(seconds % 60);
        if (s.length < 2) { s = 0 + s }
        this.display.textContent = h == "0:" ? m + s : h + m + s

        if (seconds <= 0 || !this.display) { Console.log("Countdown ended", 'Timer'); return }
        this.countdown = setTimeout((s,d) => { this.tick(s,d) }, 1000, seconds + direction, direction)
    },
    interpolate(times) {
        if (this.decay != 0) {
            Console.log("Interpolating regressive/progressive timer", 'Timer')
            this.write = (this.write - 8) * (this.decay ** times) + 8
            this.draw = (this.draw - 30) * (this.decay ** times) + 30
        } 
    },

    // deduceSettingsFromXHR(data) {
    //     console.log(data)
    // },
    // deduceSettingsFromSocket(data) {

    // }
};
Object.setPrototypeOf(Timer, CellulartModule)



 /* ----------------------------------------------------------------------
  *                                  Koss 
  * ---------------------------------------------------------------------- */
/** Knock-Off Screenshot (Koss), self-explanatory:
  * automatically takes a screenshot of the image you're supposed to 
  * memorize. The lightest module, being only 70 lines long.                    
  * ---------------------------------------------------------------------- */
const Koss = { // [K1]

    name : "Koss",
    isCheat : true,
    setting : new RedSettingsBelt(),
    // KOSS variables
    kossWIW : undefined,    // HTMLDivElement
    kossImage : undefined,  // HTMLImageElement
    kossCanvas : undefined, // HTMLCanvasElement

    init(modules) {
        this.kossWIW = Inwindow.new(false, false);
        this.kossWIW.body.style.position = 'relative';  // TODO: Too many dots
        this.kossImage = setAttributes(new Image(), { style: "position: absolute", class:"wiw-img" })
    },
    mutation(oldPhase, newPhase) { 
        // ssView.childNodes[1].appendChild(kossImage);
        const wiwBody = this.kossWIW.body
        if (wiwBody.firstChild) { wiwBody.removeChild(wiwBody.firstChild) }
        if (newPhase == 'memory') {
            setTimeout(() => { this.kossCanvas = document.querySelector(".core").querySelector("canvas") }, 10)
        }
        else if (newPhase == 'draw') {
            // document.querySelector(".core").querySelector("canvas")
            // this.kossCanvas
            this.placeCanvas()
        }
        // If the new phase is "memory", schedule a screenshot to be taken of the canvas approximately when it's done drawing.
        // if (newPhase == "memory") {
        //     // Recover the kossImage from the overlay position so that we don't lose track of it.
        //     this.kossWIW.querySelector(".wiw-body").appendChild(this.kossImage);
        //     setTimeout(this.screenshot, 1500);
        // } else if (newPhase == "draw" && this.setting.current == 'red') {
        //     setTimeout(this.tryUnderlayKossImage, 1000)
        // }
    },
    backToLobby(oldPhase) {
        // this.kossImage.src = "";
        if (this.kossCanvas) {
            this.kossCanvas.remove();
            this.kossCanvas = undefined;
        }
    },
    adjustSettings(previous, current) {
        // alert(current)
        switch (current) {
            case 'off':
                this.kossWIW.setVisibility("hidden");
                if (this.kossCanvas) { this.kossWIW.body.appendChild(this.kossCanvas); }
                break;
            case 'on':
                this.kossWIW.setVisibility("visible");
                if (this.kossCanvas) { 
                    this.kossCanvas.style.opacity = "1"; 
                    this.kossWIW.body.appendChild(this.kossCanvas); 
                }
                break;
            case 'red':
                this.kossWIW.setVisibility("visible");
                if (this.kossCanvas) { 
                    this.kossCanvas.style.opacity = "0.25"; 
                    this.tryUnderlayKossImage();
                }
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    },

    placeCanvas() {
        if (!this.kossCanvas) { return }
       /* if (this.kossCanvas) { */ this.kossCanvas.classList.add('koss-canvas') // }
        switch (this.setting.current) {
            case 'off':
                this.kossWIW.body.appendChild(this.kossCanvas);
                break;
            case 'on':
                this.kossWIW.body.appendChild(this.kossCanvas);
                break;
            case 'red':
                setTimeout(() => { this.tryUnderlayKossImage() }, 1000);
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    },
    tryUnderlayKossImage() {
        this.kossCanvas.style.opacity = "0.25";
        try { 
            document.querySelector(".drawingContainer").insertAdjacentElement("beforebegin", this.kossCanvas);
            Console.log("Koss image underlaid", 'Koss')
        } catch {
            Console.log("Koss image NOT underlaid, no place found : not on draw mode?", 'Koss')
        }
    },
}
Object.setPrototypeOf(Koss, CellulartModule)



 /* ----------------------------------------------------------------------
  *                                 Refdrop 
  * ---------------------------------------------------------------------- */
/** Refdrop allows you to upload reference images over or behind the canvas,
  * with controls for position and opacity.
  * Includes arrow key keybinds for adjustment of the image when in Red mode.
  * ---------------------------------------------------------------------- */
const Refdrop = { // [R1]
    name : "Refdrop",
    setting : new RedSettingsBelt('on'),
    keybinds : [
        new Keybind((e) => e.code == "ArrowLeft" , (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowUp"   , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowRight", (e) => { this.refImage.style.left = parseInt(this.refImage.style.left) + e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowDown" , (e) => { this.refImage.style.top  = parseInt(this.refImage.style.top)  + e.shiftKey ? 0.5 : 2 + "px" }),
                ],
    // Refdrop variables
    refUpload : undefined, // HTMLDivElement
    refImage : undefined,  // HTMLImageELement
    refCtrl : undefined,   // HTMLDivElement
    refSocket : undefined, // HTMLDivElement
    seFunctions : null,    // { clickBridge: function, screenshot: function }

    init(modules) {
        this.seFunctions = this.initRefdrop();
        this.onSocketClick = this.seFunctions.clickBridge;
        this.initRefctrl()
    },
    mutation(oldPhase, newPhase) {
        // Recover the ref controls from the lower corners so that we don't lose track of them.
        // document.body.appendChild(this.refUpload);
        // document.body.appendChild(this.refCtrl)
        // Recover the refimg from the overlay position so that we don't lose track of it.
        // this.refUpload.appendChild(this.refImage);
        this.refImage.style.visibility = "hidden";
    
        // console.log(this.setting.current)
        // console.log(this.isSetTo('off'))

        if (newPhase == "draw" && !(this.isSetTo('off'))) {
            setTimeout(() => { this.placeRefdropControls() }, 200)
        } else {
            this.refUpload.style.display = "none";
            this.refCtrl.style.display = "none";
        }
    },
    backToLobby(oldPhase) {
        this.refImage.src = "";
    },
    adjustSettings(previous, current) {
        switch (current) {
            case 'off': 
                document.querySelectorAll(".wiw-close").forEach(v => v.parentNode.parentNode.remove()) // This closes all references, forcing you to drag them in again.
                this.refImage.src = "";
                this.refUpload.style.visibility = "hidden";
                this.refCtrl.style.visibility = "hidden";
                return;
            case 'on':
                this.refUpload.style.visibility = "visible"
                this.onSocketClick = this.seFunctions.clickBridge;
                this.refSocket.style.backgroundImage = "url(" + getResource("assets/module-assets/ref-ul.png") + ")";
                return;
            case 'red':
                this.refCtrl.style.visibility = "visible";
                this.onSocketClick = this.seFunctions.screenshot;
                this.refSocket.style.backgroundImage = "url(" + getResource("assets/module-assets/ref-ss.png") + ")";
                return;
        }
    },

    initRefdrop() {
        this.refImage = setAttributes(document.createElement("img"),  { class: "bounded",    id: "ref-img"    })
        this.refUpload = setAttributes(document.createElement("div"), { style: "display: none", class: "ref-square", id: "ref-se",    parent: document.body });
        const refForm = setAttributes(document.createElement("form"),    { class: "upload-form",                 parent: this.refUpload });  
        const refBridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: refForm });
        this.refSocket = setAttributes(document.createElement("div"),   { class: "ref-border upload-socket hover-button", style: "background-image:url(" + getResource("assets/module-assets/ref-ul.png") + ")", parent: refForm });

        window.addEventListener("dragenter", (e) => {
            // Console.log("dragenter", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            Refdrop.refSocket.style.backgroundImage = "url(" + getResource("assets/module-assets/ref-ul.png") + ")"; 
        })
        window.addEventListener("dragleave", (e) => {
            // Console.log("dragleave", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            if (e.fromElement || e.relatedTarget !== null) { return }
            Console.log("Dragging back to OS", 'Refdrop')
            if (Refdrop.isSetTo('red')) { Refdrop.refSocket.style.backgroundImage = "url(" + getResource("assets/module-assets/ref-ss.png") + ")"; }
        })
        window.addEventListener("drop", (e) => {
            Console.log("drop", 'Refdrop')
            if (Refdrop.isSetTo('red')) { Refdrop.refSocket.style.backgroundImage = "url(" + getResource("assets/module-assets/ref-ss.png") + ")"; }
        }, true)
        window.addEventListener("dragover", (e) => {
            e.preventDefault()
        })
        Refdrop.refSocket.addEventListener("dragenter", (e) => {
            preventDefaults(e)
            Refdrop.refSocket.classList.add('highlight')
        }, false)
        ;['dragleave', 'drop'].forEach(eventName => {
            Refdrop.refSocket.addEventListener(eventName, (e) => {
                preventDefaults(e)
                Refdrop.refSocket.classList.remove('highlight')
            }, false)
        })
        Refdrop.refSocket.addEventListener("click", function() {
            Refdrop.onSocketClick();
        })
        refBridge.addEventListener("change", () => { handleFiles(refBridge.files) })
        Refdrop.refSocket.addEventListener('drop', handleDrop, false)

        Refdrop.refUpload.style.visibility = "hidden";

        return { clickBridge: () => { refBridge.click() }, screenshot: () => screenshot() };

        function handleDrop(e) {
            let dt = e.dataTransfer
            let files = dt.files

            handleFiles(files)
        }
        function handleFiles(files) {
            document.querySelector(".core").classList.remove("watermark")
    
            console.log(this)
            switch (Refdrop.setting.current) {
                case 'on':
                    Refdrop.newRefimgWIW(files.item(0));
                    break;
                case 'red':
                    Refdrop.refImage.style.visibility = "visible";
                    Refdrop.refImage.src = URL.createObjectURL(files.item(0))
    
                    document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
                    break;
                default:
                    Console.alert("Intended refimg location not recognised", 'Refdrop')
                    break;
            } 
        }    
        function screenshot() {
            Refdrop.refImage.src = document.querySelector(".core").querySelector("canvas").toDataURL();
            document.querySelector(".core").insertAdjacentElement("afterbegin", Refdrop.refImage);
            Refdrop.refImage.style.visibility = "visible";
            Console.log("Screenshot taken", 'Refdrop')
        }
    },
    initRefctrl() {
        this.refCtrl  = setAttributes(document.createElement("div"),    { id: "ref-sw", class: "ref-square" })
        const refpos = setAttributes(document.createElement("div"),        { class: "ref-border canvas-in-square", parent: this.refCtrl })
        const refdot = setAttributes(document.createElement("div"),        { id: "ref-dot", class: "ref-border bounded", parent: refpos })
        const reflower = setAttributes(document.createElement("div"),      { class: "canvas-square-lower-tray", parent: this.refCtrl })
        const refz = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", /*style: "background-image:url(" + chrome.runtime.getURL("assets/downz.png") + ")",*/ parent: reflower })
        const refc = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refoholder = setAttributes(document.createElement("div"),    { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refo = setAttributes(document.createElement("input"),        { id: "refo", type: "range", value: "25", parent: refoholder })

        initPantograph(refdot, this.refImage); 
        initZ         (refz,   this.refImage);
        initCenter    (refc,   this.refImage);
        initOpacity   (refo,   this.refImage);
        function initPantograph(small, large) {
            var parentCoords = {}; var ratio = 1; const parent = small.parentElement
            small.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();
            
                parentCoords = getCoords(small.parentElement)
                ratio = large.parentElement.clientWidth / small.parentElement.clientWidth
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
        
            function elementDrag(e) {
                e. preventDefault();
                // set the element's new position:
                const left = clamp(0, e.clientX - parentCoords.left, parent.offsetWidth)
                const top = clamp(0, e.clientY - parentCoords.top, parent.offsetHeight)
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
            function getCoords(elem) { // crossbrowser version
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
        function initZ(z, large) {
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
        function initCenter(c, large) {
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
        function initOpacity(o, large) {
            large.style.opacity = o.value / 100
            o.addEventListener("input", function() {
                large.style.opacity = o.value / 100;
            })
        }

        this.refCtrl.style.visibility = "hidden";
    }, // [R6]
    onSocketClick() { }, // Dynamically set
    placeRefdropControls() {
        document.querySelector(".tools").insertAdjacentElement("beforebegin", this.refUpload);
        document.querySelector(".tools").insertAdjacentElement("afterend", this.refCtrl);
        this.refUpload.style.display = "initial";
        this.refCtrl.style.display = "initial";
        

        if (!(this.isSetTo('off'))) { this.refUpload.style.visibility = "visible" }
        if (this.isSetTo('red')) { this.refCtrl.style.visibility = "visible" }
        //Debug.log(Refdrop, "Refdrop placed")
    }, // [R5]
    newRefimgWIW(object) {
        const i = setAttributes(new Image(), { class: "wiw-img", src: URL.createObjectURL(object) })
        i.onload = function() {
            const newRefWIW = Inwindow.new(true, true, i.height / i.width);
            newRefWIW.body.appendChild(i)
        }
        /*
        const newRefWIWImg = new Image();
        newRefWIWImg.classList.add("wiw-img");
        newRefWIW.children[1].appendChild(newRefWIWImg);
        newRefWIWImg.src = URL.createObjectURL(object);*/
    } // [R4]
}
Object.setPrototypeOf(Refdrop, CellulartModule)



 /* ----------------------------------------------------------------------
  *                            Spotlight (DOWN)
  * ---------------------------------------------------------------------- */
/** Spotlight condenses your performance for the current round into a gif. 
  * The most spaghetti, convoluted module, second longest at 300 lines.
  * And it's not even particularly useful.   
  * Down for maintenance.                              
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
        this.bg.src = getResource("assets/module-assets/spotlight-base.png");
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
        const dlicon = setAttributes(new Image(), { class: "cellulart-circular-icon", src: getResource("assets/menu-icons/spotlight_on.png") })
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



 /* ----------------------------------------------------------------------
  *                              Triangle (WIP)
  * ---------------------------------------------------------------------- */
/** Triangles (full with T, outlined with K).
  * Possibly opens the door to a third generation of autodrawers.
  * (WIP) This module is not initialized by Controller.        
  * ---------------------------------------------------------------------- */
const Triangle = { // [F2]
    name : "Triangle",          // All modules have a name property
    setting : new SettingsBelt(['isoceles','3point'],),    // All modules have a SettingsBelt
    // keybinds : [
    //     new Keybind((e) => e.code == "T" , (e) => { this.beginDrawingFullTriangle() }),
    //     new Keybind((e) => e.code == "K" , (e) => { this.beginDrawingFrameTriangle() }),
    //             ],
    // previewCanvas : undefined, 

    init(modules) {}, // Probably empty.
    mutation(oldPhase, newPhase) {
        // Probably, we should discard the preview canvas (let it get removed from DOM),
        // and reinitialize it on every new drawing phase.
    },
    backToLobby(oldPhase) {},  // Probably empty.
    adjustSettings(previous, current) {
        switch (current) {
            case 'isoceles': break;
                // 
            case '3point': break;
                // 
        }
        // Isoceles and 3-point have entirely different control schemes.
    },

    beginDrawingFullTriangle() {

    },
    beginDrawingFrameTriangle() {

    },
    deselect() {
        // I need to carefully juggle variables to yield the correct behaviour when deselecting.
    },

    // Snowball 2, 6, 10, 14, 18
}
Object.setPrototypeOf(Triangle, CellulartModule)



 /* ----------------------------------------------------------------------
  *                               Reveal (WIP)
  * ---------------------------------------------------------------------- */
/** Reveal uncovers the secrets of the Secret mode. Considered a "cheat". 
  * Current implementation requires invasive XHR patching 
  * and can't be turned off, so I'm working on a softer one.
  * (WIP) This module is not initialized by Controller.
  * ---------------------------------------------------------------------- */
const Reveal = {

    name : "Reveal",
    isCheat : true,
    setting : new RedSettingsBelt('off'), // SettingsBelt(["OFF", "TEXT"], 0, "ALL"), // [V2]

    hiddenElements : undefined,

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (this.isSetTo("OFF")) { return; }
        if (newPhase == "write" || newPhase == "first") {
            this.revealPrompt()
        } else if (this.itSetTo("ALL") && newPhase == "draw") {
            this.revealDrawing()
        }
    },
    /*
    // (deprecated) This function receives messages from the popup
    recieveMessage(message) {}

    // (deprecated) This function asks the module what message it would like to pass to the popup
    getMessage() {} */
    // backToLobby() {} // Empty.
    // These functions receive messages from the in-window menu
    adjustSettings(previous, current) {
        switch (current) {
            case "OFF": this.rehide(); break;
            case "TEXT": this.revealPrompt(); break;
            case "ALL": this.revealDrawing(); break;
        }
    },

    revealPrompt() {
        // TODO: Can't I use an enable/disable CSS or CSS variable thing instead?
        this.hiddenElements = document.querySelector(".center").querySelectorAll(".hiddenMode")
        this.hiddenElements.forEach(n => n.style.cssText = "font-family:Bold; -webkit-text-security: none")
    },
    revealDrawing() {
        // this.hiddenCanvases = document.querySelector(".drawingContainer").querySelectorAll("canvas");
        // this.hiddenCanvases[1].addEventListener("mouseup", () => {
        //     const newwiw = Inwindow.new(true, true);
        //     setAttributes(new Image(), { class: "wiw-img", parent: newwiw.body, src: this.hiddenCanvases[0].toDataURL() })
        // })
        // [V3]
    },
    rehide() {
        this.hiddenElements.forEach(n => n.style.cssText = "");
        // [V3]
    }

    // animate the black cover lifting to gray [V3]
}
Object.setPrototypeOf(Reveal, CellulartModule)



 /* ----------------------------------------------------------------------
  *                               Scry (WIP)
  * ---------------------------------------------------------------------- */
/** Scry helps keep the game moving by telling you who has and hasn't
  * hit the "Done" button.
  * ---------------------------------------------------------------------- */
const Scry = { // [F2]
    name : "Scry",          // All modules have a name property
    hasMenuButton : true,   // Some modules aren't directly controllable
    setting : new SettingsBelt(['off','windowed','sleek'], 2),    // All modules have a SettingsBelt
    keybinds : [
        // This keybind turns off when Scry does, because maybe people use tab as part of their drawing workflow.
        new Keybind((e) => { return Scry.setting.current != 'off' && e.code == "Tab" }, (e) => { console.log("tab"); preventDefaults(e); /*this.show something or other*/ })
    ],

    activeIndices: new Set(),
    playerDict: {},
    // Initialization. 
    // To be overridden by each module.
    init(modules) {},

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    mutation(oldPhase, newPhase) {
        if (oldPhase != 'lobby') { return }
        this.prune()
    },

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    backToLobby(oldPhase) {
        this.prune()
    }, 

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous, current) {},

    // This function should set internal states based on the game config
    // depending on the needs of the module.
    // To be overridden by each module that requires more than marginal state knowledge.
    updateLobbySettings(dict) {
        // switch (type) {
        //     case 2: {       // new player joins            42[2,2,{"id":3,"nick":"CoolNickname4534","avatar":21,"owner":false,"viewer":false,"points":0,"change":0,"alert":false},false]
        //         // const d = this.trim(data)
        //         this.playerDict[data.id] = this.trim(data)
        //         this.activeIndices.add(data.id)
        //         break;  
        //     }
        //     case 3: {       // player leaves               42[2,3,{"userLeft":2,"newOwner":null},false]
        //         this.activeIndices.remove(data.userLeft)
        //         break;
        //     }
        //     case 15: {
        //         console.log(data);
        //         console.log(this.playerDict[data.user])
        //         console.log(data.ready)
        //         break;
        //     }
        //     case 21: {      // player leaves               42[2,21,{"userLeft":3,"newOwner":null}]
        //         this.activeIndices.remove(data.userLeft)
        //         break;
        //     }
        //     case 22: {      // player rejoins / reconnects 42[2,22,3] 
        //         this.activeIndices.add(data)
        //         break;  
        //     }
        //     // (TODO: study the way the ids are shuffled/reassigned at start of new turn. It seems like they completely aren't. Memory leak possible?)
        //     // (i think) there is a memory leak in gartic involving the lack of reassignment of user IDs when people leave, meaning that if you start a lobby and a total of 9 quadrillion people join and leave, things might start going wrong
        // }
    },

    trim(dict) {
        const d = {}
        // d.id = dict.id
        d.nick = dict.nick
        d.avatar = dict.avatar
    },
    prune() {
        for (const key of Object.keys(this.playerDict)) {
            if (!this.activeIndices.includes(key)) {
                delete this.playerDict.key
            }
        }
    },
}
Object.setPrototypeOf(Scry, CellulartModule)

// #endregion


// console.log(Object.keys(window))
if (typeof exports !== 'undefined') {
    module.exports = { Debug, Red, Timer, Koss, Refdrop, Spotlight, Geom, Triangle, Reveal, Scry };
}
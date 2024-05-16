/* ----------------------------------------------------------------------
  *                            CellulartModule 
  * ---------------------------------------------------------------------- */
/** CellulartModule outlines methods relating to setting changes
  * and phase changes (with a special case for entering or returning
  * to the lobby), amongst other frameworks to make adding new functionalities
  * easy as pie.
  * ---------------------------------------------------------------------- */
const CellulartModule = { // [F2]
    name : "null",          // All modules have a name property
    hasMenuButton : true,   // Some modules aren't directly controllable
    isCheat : false,        // Most modules declare if they are unfair or not
    setting : undefined,    // All modules have a SettingsBelt
    keybinds : undefined,   // Some modules have keybinds

    // Initialization. 
    // To be overridden by each module.
    init(modules) {},

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    mutation(oldPhase, newPhase) {},

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    backToLobby(oldPhase) {}, 

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous, current) {},

    // This function should set internal states based on the game config
    // depending on the needs of the module.
    // To be overridden by each module that requires more than marginal state knowledge.
    adjustGameParameters(parameters) {},

    // These functions receive messages from the in-window menu and are generally shared between modules.
    menuStep() { const c = this.setting.current(); const n = this.setting.next(); this.adjustSettings(c,n); Console.log(n, this.name); return n },
    togglePlus(plus) { if (plus) { this.setting.extend() } else { this.setting.retract() } },
    current() { return this.setting.current() }
    // An unstated assumption is that the following is always equal to 0 or 1:
    // the number of times togglePlus(true) is called minus the number of times togglePlus(false) is called.
}


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
        const debugWIW = WIW.newWIW(false, false, 0.2)
        const body = setAttributes(debugWIW.querySelector(".wiw-body"), { id:"debug-body" });
        const iconSelect = setAttributes(document.createElement("div"), { id: 'debug-header', parent: body })

        // const preactivated = [ Observer ]
        modules.concat([Socket, Xhr, { name:"Worker" }, Observer]).forEach((mod) => {
            const modIcon = setAttributes(document.createElement("img"), { class: "cellulart-circular-icon", src: chrome.runtime.getURL("assets/menu-icons/" + mod.name.toLowerCase() + "_on" + ".png"), parent: iconSelect })
            modIcon.addEventListener("click", toggle)
            if (Console.enabled.has(mod.name)) { 
                modIcon.classList.add("debug-selected")
            }
            function toggle() {
                modIcon.classList.toggle("debug-selected")
                Console.toggle(mod.name)
            }
        }) 

        Debug.debugWIW = debugWIW;
    },
    adjustSettings(previous, current) {
        if (current == 'on') { 
            Debug.debugWIW.style.visibility = 'initial'; return 
        }
        Debug.debugWIW.style.visibility = 'hidden'
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

    init(modules) { this.modules = modules.filter((x) => { 'setting' in x }) },
    adjustSettings(previous, current) {
        this.modules.forEach((mod) => { mod.togglePlus(current == 'red') })
    }
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

    parameters : {    
        turns: 0,              // used by Timer 
        write: 40,             // used by Timer
        draw: 150,             // used by Timer
        decay: 0,              // used by Timer
        firstMultiplier: 1.25, // used by Timer
    },

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (["book", "start"].includes(newPhase)) { return }
        setTimeout(Timer.placeTimer, 200)

        // If we changed from a phase that warrants a reset in the timer, reset the timer.
        if (oldPhase == "memory" && newPhase != "memory") { return } // !["lobby", "write", "draw", "first"].includes(phase) && newPhase != "memory") { return }
        clearTimeout(Timer.countdown)
        setTimeout(Timer.restartTimer, 200, newPhase)
    },
    // backToLobby(oldPhase) {}, // Empty.
    adjustSettings(previous, current) {
        if (Timer.display == undefined) { return }
        if (current == "on") { Timer.display.style.visibility = "visible" } else { Timer.display.style.visibility = "hidden" }
    },
    adjustGameParameters(parameters) {
        const config = parameters.config
        const midgame = parameters.turnMax > 0
        if (config.tab == 1) { 
            Console.log("XHR can use presets", 'Observer')
            try {
                // const preset = Converter.modeIndexToString(config.mode)
                // Object.assign(Timer.parameters, Converter.getParameters(preset));
                // switch (preset) {
                //     case "ICEBREAKER":  Timer.parameters.turns = players + 1; break;
                //     case "MASTERPIECE": Timer.parameters.turns = 1;           break;
                //     case "CROWD":       Timer.parameters.turns = players / 2; break;
                //     case "KNOCK-OFF":   Timer.parameters.turns = Math.exp(8 / players); Timer.parameters.turns = players; break;
                //     default:            Timer.parameters.turns = players;     break;
                // }
                // Timer.rejoinInterpolate(data.turnNum)
            } catch {
                Console.alert('This is an unknown preset, defaulting to piecewise assignment', 'Observer')
                setPiecewise()
            }
        } else { setPiecewise() }
        function setPiecewise() {
            Console.log("XHR can't use presets", 'Observer')
            Timer.parameters.turns = midgame ? parameters.turnMax : Converter.turnsStringToFunction(config.turns)(players) 
            Object.assign(Timer.parameters, Converter.timeStringToParameters(config.speed))
            Timer.parameters.fallback = Converter.flowStringToFallback(config.first)
        }

        // Converter.setMode('CUSTOM')
        // TODO: add piecewise assignment here
        // game.turns = Converter.turnsStringToFunction(gameConfig[2])(players) 
        // Object.assign(game, Converter.timeStringToParameters(gameConfig[0]))
        // game.fallback = Converter.flowStringToFallback(gameConfig[1])

        if (midgame) {
            // todo: in theory we should pass these through to all the modules, but ehh.
            // Timer.parameters.turns = parameters.turnMax
            Timer.interpolate(parameters.turnNum)
        }
    },

    placeTimer() {  // [T3]
        const p = document.querySelector("p.jsx-3561292207"); if (p) { p.remove() }

        // todo: is it even possible to run a rescue scheme, given that we pluck the clock and stick it in the holder?
        const clock = document.querySelector(".time");

        const holder = setAttributes(document.createElement("div"), { id: "clocksticles" })
        clock.insertAdjacentElement("beforebegin", holder) // These two lines
        holder.appendChild(clock)                          // finesse the clock into its holder.

        const timerHolder = setAttributes(document.createElement("div"), { id: "timerHolder", parent: holder })

        Timer.display = setAttributes(document.createElement("div"), { id: "timer", style: "visibility:" + Timer.setting.current() == 'off' ? "hidden" : "visible", parent: timerHolder })
    },
    restartTimer(newPhase) {
        const clock = document.querySelector(".time")
        if (clock.classList.contains("lock")) {
            const p = clock.querySelector("p"); if(p) { p.style.visibility = "hidden" } // Prevents clashing with SillyV's extension
            Timer.tick(1, 1)
        } else {
            Timer.tick(Timer.getSecondsForPhase(newPhase) - 1, -1)
        }
        // if (game.parameters["timerCurve"] != 0) { 
        Timer.interpolate(1); 
        // }
    },
    getSecondsForPhase(newPhase) {
        Console.log("I think this phase is " + newPhase, 'Timer');
        var toReturn = 0;
        switch (newPhase) {
            case 'draw': case 'memory': 
                // Checks if first turn && the firstMultiplier is so extreme that it must be either FASTER FIRST or SLOWER FIRST
                if (![1,1.25].includes(game.firstMultiplier) && document.querySelector(".step").textContent.slice(0, 2) == "1/") {
                    toReturn = 150 * game.firstMultiplier;  // Experimental optimization replacing game.draw with flat 150
                } else { 
                    toReturn = game.draw;
                } break;
            case 'write': toReturn = game.write; break;
            case 'first': toReturn = game.write * game.firstMultiplier; break;
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
        Timer.display.textContent = h == "0:" ? m + s : h + m + s

        if (seconds <= 0 || !Timer.display) { Console.log("Countdown ended", 'Timer'); return }
        Timer.countdown = setTimeout(Timer.tick, 1000, seconds + direction, direction)
    },
    interpolate(times) {
        if (game.decay != 0) {
            Console.log("Interpolating regressive/progressive timer", 'Timer')
            game.write = (game.write - 8) * (game.decay ** times) + 8
            game.draw = (game.draw - 30) * (game.decay ** times) + 30
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

    init(modules) {
        Koss.kossWIW = WIW.newWIW(false, false);
        Koss.kossImage = setAttributes(new Image(), { style: "position: absolute", class:"wiw-img" })
    },
    mutation(oldPhase, newPhase) { 
        // ssView.childNodes[1].appendChild(kossImage);
        
        // If the new phase is "memory", schedule a screenshot to be taken of the canvas approximately when it's done drawing.
        if (newPhase == "memory") {
            // Recover the kossImage from the overlay position so that we don't lose track of it.
            Koss.kossWIW.querySelector(".wiw-body").appendChild(Koss.kossImage);
            setTimeout(Koss.screenshot, 1500);
        } else if (newPhase == "draw" && Koss.setting.current() == 'red') {
            setTimeout(Koss.tryUnderlayKossImage, 1000)
        }
    },
    backToLobby(oldPhase) {
        Koss.kossImage.src = "";
    },
    adjustSettings(previous, current) {
        // alert(current)
        switch (current) {
            case 'off':
                Koss.kossImage.style.opacity = "1";
                // Koss.kossImage.style.position = "static";
                Koss.kossWIW.style.visibility = "hidden";
                Koss.kossImage.style.display = "none"; // todo for some reason going from OVERLAY to OFF wipes your canvas unless you use display instead of visibility parameter, wtf?
                
                break;
            case 'on':
                Koss.kossImage.style.display = "initial";

                Koss.kossWIW.style.visibility = "visible";
                Koss.kossWIW.querySelector(".wiw-body").appendChild(Koss.kossImage);
                break;
            case 'red':
                Koss.kossWIW.style.visibility = "hidden";

                Koss.kossImage.style.opacity = "0.25";
                // Koss.kossImage.style.position = "absolute";
                
                //var kossimg_host = document.createElement("div");
                //kossimg_host.classList.add("kossImage-host");
                Koss.tryUnderlayKossImage();
                //kossimg_host.style.backgroundImage = "url(\"".concat(kossImage.src, "\")"); 
                //document.querySelector(".watermark").style.backgroundImage = "url('/images/ic_ready.svg')"
                //document.querySelector(".watermark").classList.toggle("kossImage-host");
                break;
            default: Console.alert("KOSS location not recognised", 'Koss')
        }
    },
    // adjustGameParameters(parameters) {},

    // This function takes a screenshot of the core canvas and shows it on the kossImage element.
    
    tryUnderlayKossImage() {
        try { 
            document.querySelector(".drawingContainer").insertAdjacentElement("beforebegin", Koss.kossImage);
            Console.log("Koss image underlaid", 'Koss')
        } catch {
            Console.log("Koss image NOT underlaid, no place found : not on draw mode?", 'Koss')
        }
    },
    screenshot() {
        Koss.kossImage.src = document.querySelector(".core").querySelector("canvas").toDataURL();
        Console.log("Screenshot taken", 'Koss')
    }
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
        new Keybind((e) => e.code == "ArrowLeft" , (e) => { Refdrop.refImage.style.left = parseInt(Refdrop.refImage.style.left) - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowUp"   , (e) => { Refdrop.refImage.style.top  = parseInt(Refdrop.refImage.style.top)  - e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowRight", (e) => { Refdrop.refImage.style.left = parseInt(Refdrop.refImage.style.left) + e.shiftKey ? 0.5 : 2 + "px" }),
        new Keybind((e) => e.code == "ArrowDown" , (e) => { Refdrop.refImage.style.top  = parseInt(Refdrop.refImage.style.top)  + e.shiftKey ? 0.5 : 2 + "px" }),
                ],
    // Refdrop variables
    refUpload : undefined, // HTMLDivElement
    refImage : undefined,  // HTMLImageELement
    refCtrl : undefined,   // HTMLDivElement
    refSocket : undefined, // HTMLDivElement
    seFunctions : null,    // { clickBridge: function, screenshot: function }

    init(modules) {
        Refdrop.seFunctions = Refdrop.initRefdrop();
        Refdrop.onSocketClick = Refdrop.seFunctions.clickBridge;
        Refdrop.initRefctrl()
    },
    mutation(oldPhase, newPhase) {
        // Recover the ref controls from the lower corners so that we don't lose track of them.
        document.body.appendChild(Refdrop.refUpload);
        document.body.appendChild(Refdrop.refCtrl)
        // Recover the refimg from the overlay position so that we don't lose track of it.
        Refdrop.refUpload.appendChild(Refdrop.refImage);
        Refdrop.refImage.style.visibility = "hidden";
    
        if (newPhase == "draw") {
            setTimeout(Refdrop.placeRefdropControls, 200)
        } else {
            Refdrop.refUpload.style.display = "none";
            Refdrop.refCtrl.style.display = "none";
        }
    },
    backToLobby(oldPhase) {
        Refdrop.refImage.src = "";
    },
    adjustSettings(previous, current) {
        switch (current) {
            case 'off': 
                document.querySelectorAll(".wiw-close").forEach(v => v.parentNode.parentNode.remove()) // This closes all references, forcing you to drag them in again.
                Refdrop.refImage.src = "";
                Refdrop.refUpload.style.visibility = "hidden";
                Refdrop.refCtrl.style.visibility = "hidden";
                return;
            case 'on':
                Refdrop.refUpload.style.visibility = "visible"
                Refdrop.onSocketClick = Refdrop.seFunctions.clickBridge;
                Refdrop.refSocket.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/module-assets/ref-ul.png") + ")";
                return;
            case 'red':
                Refdrop.refCtrl.style.visibility = "visible";
                Refdrop.onSocketClick = Refdrop.seFunctions.screenshot;
                Refdrop.refSocket.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/module-assets/ref-ss.png") + ")";
                return;
        }
    },
    // adjustGameParameters(parameters) {},

    initRefdrop() {
        Refdrop.refImage = setAttributes(document.createElement("img"),  { class: "bounded",    id: "ref-img"    })
        Refdrop.refUpload = setAttributes(document.createElement("div"), { style: "display: none", class: "ref-square", id: "ref-se",    parent: document.body });
        const refForm = setAttributes(document.createElement("form"),    { class: "upload-form",                 parent: Refdrop.refUpload });  
        const refBridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: refForm });
        Refdrop.refSocket = setAttributes(document.createElement("div"),   { class: "ref-border upload-socket hover-button", style: "background-image:url(" + chrome.runtime.getURL("assets/module-assets/ref-ul.png") + ")", parent: refForm });

        window.addEventListener("dragenter", function(e){
            // Console.log("dragenter", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            Refdrop.refSocket.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/module-assets/ref-ul.png") + ")"; 
        })
        window.addEventListener("dragleave", function(e){
            // Console.log("dragleave", Refdrop)
            // Console.log(e.relatedTarget, Refdrop)
            if (e.fromElement || e.relatedTarget !== null) { return }
            Console.log("Dragging back to OS", 'Refdrop')
            if (Refdrop.setting.current() == 'red') { Refdrop.refSocket.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/module-assets/ref-ss.png") + ")"; }
        })
        window.addEventListener("drop", function(e){
            Console.log("drop", 'Refdrop')
            if (Refdrop.setting.current() == 'red') { Refdrop.refSocket.style.backgroundImage = "url(" + chrome.runtime.getURL("assets/module-assets/ref-ss.png") + ")"; }
        }, true)
        window.addEventListener("dragover", function(e){
            e.preventDefault()
        })
        Refdrop.refSocket.addEventListener("dragenter", function(e) {
            preventDefaults(e)
            Refdrop.refSocket.classList.add('highlight')
        }, false)
        ;['dragleave', 'drop'].forEach(eventName => {
            Refdrop.refSocket.addEventListener(eventName, function(e) {
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
    
            switch (Refdrop.setting.current()) {
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
        Refdrop.refCtrl  = setAttributes(document.createElement("div"),    { id: "ref-sw", class: "ref-square" })
        const refpos = setAttributes(document.createElement("div"),        { class: "ref-border canvas-in-square", parent: Refdrop.refCtrl })
        const refdot = setAttributes(document.createElement("div"),        { id: "ref-dot", class: "ref-border bounded", parent: refpos })
        const reflower = setAttributes(document.createElement("div"),      { class: "canvas-square-lower-tray", parent: Refdrop.refCtrl })
        const refz = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", /*style: "background-image:url(" + chrome.runtime.getURL("assets/downz.png") + ")",*/ parent: reflower })
        const refc = setAttributes(document.createElement("div"),          { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refoholder = setAttributes(document.createElement("div"),    { class : "ref-border ref-tray-button hover-button", parent: reflower })
        const refo = setAttributes(document.createElement("input"),        { id: "refo", type: "range", value: "25", parent: refoholder })

        initPantograph(refdot, Refdrop.refImage); 
        initZ         (refz,   Refdrop.refImage);
        initCenter    (refc,   Refdrop.refImage);
        initOpacity   (refo,   Refdrop.refImage);
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

        Refdrop.refCtrl.style.visibility = "hidden";
    }, // [R6]
    onSocketClick() { }, // Dynamically set
    placeRefdropControls() {
        document.querySelector(".tools").insertAdjacentElement("beforebegin", Refdrop.refUpload);
        document.querySelector(".tools").insertAdjacentElement("afterend", Refdrop.refCtrl);
        Refdrop.refUpload.style.display = "initial";
        Refdrop.refCtrl.style.display = "initial";
        
        Refdrop.refUpload.style.visibility = "visible";
        if (Refdrop.setting.current() == 'red') { Refdrop.refCtrl.style.visibility = "visible" }
        //Debug.log(Refdrop, "Refdrop placed")
    }, // [R5]
    newRefimgWIW(object) {
        const i = setAttributes(new Image(), { class: "wiw-img", src: URL.createObjectURL(object) })
        i.onload = function(){
            const newRefWIW = WIW.newWIW(true, true, i.height / i.width);
            newRefWIW.children[1].appendChild(i)
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
    slideNum : -1,
    keySlideNum : -3,
    
    init(modules) {
        Spotlight.bg.src = chrome.runtime.getURL("assets/module-assets/spotlight-base.png");
    },
    mutation(oldPhase, newPhase) {
        if (newPhase != 'book') { return }
        if (oldPhase == "start") {
            // In case you had to reload in the middle of visualization
            game.user = (document.querySelector(".users") ?? document.querySelector(".players")).querySelector("i").parentNode.nextSibling.textContent
        }
        Spotlight.avatars = Array.from(document.querySelectorAll(".avatar")).map(element => window.getComputedStyle(element.childNodes[0]).backgroundImage.slice(5, -2));//.slice(13, -2) );//.slice(29, -2));
        Spotlight.names = Array.from(document.querySelectorAll(".nick")).map(element => element.textContent);

        Spotlight.compositeBackgrounds();
        game.turns > 0 
            ? Spotlight.compositedFrameDatas = new Array(game.turns - 1) 
            : Spotlight.compositedFrameDatas = {}

        Spotlight.attachBookObserver();
    },
    
    backToLobby(oldPhase) {
        if (oldPhase != 'book') { return }
        Spotlight.compileToGif()
        Spotlight.timelineObserver.disconnect()
        Spotlight.avatars = []
        Spotlight.names = []
    },
    adjustSettings(previous, current) {
        // TODO: TODO override menuStep to prevent this to begin with. Also, this is the wrong thing to check.
        // if (current == "book") { Console.alert("Changing Spotlight settings mid-album visualization tends to have disastrous consequences", 'Spotlight') }
    },
    // adjustGameParameters(parameters) {},

    // Compiles an array of ImageData into a GIF.
    compileToGif() {
        if( Spotlight.setting.current() == 'off' || Spotlight.compositedFrameDatas.length == 0) { return }
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
            index += 1
            if (!data) { continue }
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
        const filename = "Spotlight " + game.user + " " + day + " " + time + ".gif"
        function download (buf, filename, type) {
            const blob = buf instanceof Blob ? buf : new Blob([buf], { type });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
        }

        const dlnode = WIW.newWIW(true, true)
        const dlicon = setAttributes(new Image(), { class: "cellulart-circular-icon", src: chrome.runtime.getURL("assets/menu-icons/spotlight-1.png") })
        dlicon.onclick = function() {
            download(buffer, filename, { type: 'image/gif' });
            dlnode.remove();
        }
        dlnode.children[1].appendChild(dlicon)
        document.body.appendChild(dlnode)
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
    bookObserver : new MutationObserver(() => {
        // console.log("timline obse fired; attaching book obse"); 
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
        if (records[0].removedNodes.length > 0) {
            // console.log("New timeline entered; resetting slideNums")
            Spotlight.slideNum = -1;
            Spotlight.keySlideNum = -2;
            return;
        }
        // what if an EMPTY response? Sometimes backtrack two steps, sometimes one. Hence modeParameters now has fallback values.
        Spotlight.slideNum += 1
        const currentSlide = records[0].addedNodes[0];
        if ((currentSlide.querySelector(".nick") ?? currentSlide.querySelector("span")).textContent == game.user) {
            Spotlight.keySlideNum = Spotlight.slideNum
        } else if (Spotlight.slideNum == game.turns) {//currentSlide.querySelector(".download") != null) {
            // console.log("Stepped over. Compositing response")
            Spotlight.compositeResponseFrame()
        }
    }),

    // These functions manage the compositing of timelines into ImageDatas.
    compositeBackgrounds() {
        if( Spotlight.setting.current() == 'off' ) { return }
        const canvas = Spotlight.initFrom(Spotlight.bg)
        const context = canvas.context
        Spotlight.drawText(context, "HOSTED BY " + Spotlight.names[0].toUpperCase(), 1206, 82, 50, 400, "M", "white")
        switch (Spotlight.setting.current()) {
            case 'on':
                Spotlight.drawName(context, game.user.toUpperCase(), "R") 
                Spotlight.drawPFP(context, Spotlight.avatars[Spotlight.names.indexOf(game.user)], "R")
                break;
            // case 1:
            //     Spotlight.drawName(context, game.user.toUpperCase(), "L") 
            //     Spotlight.drawPFP(context, Spotlight.avatars[Spotlight.names.indexOf(game.user)], "L")
            //     break;
            default:
                Console.alert("Spotlight setting not recognized", 'Spotlight')
        }
        // intendurl = canvas;
        // setTimeout(preview, 1000)
        Spotlight.canbase = canvas.canvas;
    },
    compositeResponseFrame() {  // TODO incorrectly grabbing the same image twice, wtf?
        // todo: What to do if the one being spotlighted has an EMPTY?
        if( Spotlight.setting.current() == 'off' ) { return }
        const canvas = Spotlight.initFrom(Spotlight.canbase)
        const context = canvas.context

        const side = Spotlight.setting.current() == 'on' ? { key:'R', other: 'L' } : { key:'L', other: 'R' }
        
        // Determinine slides
        const slides = document.querySelector(".timeline").querySelectorAll(".item");
        const keySlide = slides[Spotlight.keySlideNum]
        var prevIndex = indexOfPrevSlide()
        if (prevIndex < 0) { Console.alert("Could not find fallback; no frame will be saved", 'Spotlight'); return;} //prevIndex += modeParameters[game.mode]["fallback"] }
        const prevSlide = slides[prevIndex]
        const prevUser = (prevSlide.querySelector(".nick") ?? prevSlide.querySelector("span")).textContent;
    
        // Draw everything
        Spotlight.drawName(context, prevUser.toUpperCase(), side.other)
        Spotlight.drawPFP(context, Spotlight.avatars[Spotlight.names.indexOf(prevUser)], side.other)
        try { Spotlight.drawDrawing(context, prevSlide.querySelector("canvas"), side.other) } catch { Spotlight.drawPrompt(context, prevSlide.querySelector(".balloon").textContent, side.other) }
        try { Spotlight.drawDrawing(context,  keySlide.querySelector("canvas"), side.key  ) } catch { Spotlight.drawPrompt(context, keySlide.querySelector(".balloon").textContent, side.key ) }
        Spotlight.drawTurnsCounter(context, Spotlight.keySlideNum, game.turns - 1)
        // TODO being on a different tab causes image grabs to fail
    
        setTimeout(Spotlight.preview, 500, canvas.canvas) // Temporary
        setTimeout(function() {Spotlight.compositedFrameDatas[Spotlight.keySlideNum - 1] = context.getImageData(0, 0, 1616, 683).data}, 200) // TODO: Horrendously bad bodged solution to the pfp not yet being loaded

        function indexOfPrevSlide() {
            var i = game.fallback > 0 ? Spotlight.keySlideNum - 1 : 0; 
            /* console.log(modeParameters[game.mode]); console.log(modeParameters[game.mode]["fallback"]); console.log(slideNum); console.log(keySlideNum); console.log(keySlide) */ // console.log(prevIndex); console.log(slides);
            while (i >= 0 && slides[i].querySelector(".empty") != null) { i -= game.fallback; }
            return i
        }
    }, // [S3]
    
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

    drawDrawing(context, drawing, side) {
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
    
        Spotlight.drawText(context, prompt, (side == "L" ? 412 : 1204), 423, 60, 748, "M", "#180454");
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
        const pfp = new Image(); pfp.setAttribute('crossorigin', 'anonymous'); pfp.src = pfpURL; pfp.onload = function() { 
        context.drawImage(pfp, (side == "L" ? 39 : 1422), 7, 155, 175) };
    },
}
Object.setPrototypeOf(Spotlight, CellulartModule)



 /* ----------------------------------------------------------------------
  *                                  Geom 
  * ---------------------------------------------------------------------- */
/** Geom (Geometrize) is the second generation of Gartic autodrawers 
  * after rate limiting culled the first generation.     
  * The longest module at 360 lines. Some of my finer work.                  
  * ---------------------------------------------------------------------- */
const Geom = { 

    name : "Geom",         
    isCheat : true,
    setting : new WhiteSettingsBelt(),

    geomWIW : undefined,                // HTMLDivElement
    geomPreview : undefined,            // HTMLSVGElement
    stepCallback : undefined,           // TimeoutID
    shapeQueue: [],                     // Queue
    flags: { interval: true, queue: false, pause: true, mode: false, ws: false, generate: true,
        notClearToSend() { return !(this.interval && this.queue && !this.pause && this.mode && this.ws) } },
    counters: { created: 0, sent: 0 },
    config: { distance: 1200, max: 20000 },

    init(modules) {
        Socket.addMessageListener('flag', (data) => {
            Geom.flags.ws = data
        })

        const initializedFunctions = Geom.initGeomWIW()
        Geom.setSendPause = initializedFunctions.pause
        Geom.stopGeometrize = initializedFunctions.stop
        Geom.updateLabel = initializedFunctions.label
    },
    mutation(oldPhase, newPhase) {
        Geom.setSendPause(false)
        if (newPhase != 'draw') { 
            Geom.flags.mode = false; 
            return 
        }
        // if (oldPhase == 'start') {
        //     Shelf.retrieveOrElse('strokeCount', 0, false).then(c => Socket.post('setStroke', c))
        // } else {
        //     Socket.post('clearStrokes')
        // }
        Geom.flags.mode = true
        Geom.geomPreview = setAttributes(document.createElementNS(svgNS, "svg"), { class: "geom-svg", viewBox: "0 0 758 424", width: "758", height: "424", parent: document.querySelector(".core") })
    },
    backToLobby(oldPhase) {
        if (oldPhase != 'start') { Geom.stopGeometrize() }
    }, 
    adjustSettings(previous, current) { 
        // hide or show Geom window without stopping web worker (just like Koss)
        if (current == 'off') {
            Geom.setSendPause(false)
            Geom.geomWIW.style.visibility = "hidden"
        } else {
            Geom.geomWIW.style.visibility = "visible"
        }
    },
    // adjustGameParameters(parameters) {},

    initGeomWIW() { // [G8]
        const newWIW = setAttributes(WIW.newWIW(false, false, 1), { "id":"geom-wiw" })
        const body = newWIW.querySelector(".wiw-body")

        const geomScreen1 = constructScreen1();
        var geomScreen2 = undefined;
        var geomScreen3 = undefined;

        function constructScreen1() { 
            const o = {};

            o.body = setAttributes(document.createElement("div"),     { class: "geom-carpet", parent: body });
            o.form = setAttributes(document.createElement("form"),    { class: "upload-form",                 parent: o.body });
            o.bridge = setAttributes(document.createElement("input"), { class: "upload-bridge", type: "file", parent: o.form });
            o.socket = setAttributes(document.createElement("div"),   { id: "geom-socket", class: "geom-border upload-socket hover-button", style: "background-image:url(" + chrome.runtime.getURL("assets/module-assets/geom-ul.png") + ")", parent: o.form })
            
            ;['dragenter'].forEach(eventName => {
                o.socket.addEventListener(eventName, function(e) {
                    preventDefaults(e)
                    o.socket.classList.add('highlight')
                }, false)
            })
            ;['dragleave', 'drop'].forEach(eventName => {
                o.socket.addEventListener(eventName, function(e) {
                    preventDefaults(e)
                    o.socket.classList.remove('highlight')
                }, false)
            })
            o.socket.addEventListener("click", () => { o.bridge.click();})
            o.bridge.addEventListener("change", () => { startGeometrize(o.bridge.files) })
            o.socket.addEventListener('drop', handleDrop, false)

            return o

            function handleDrop(e) {
                const dt = e.dataTransfer
                const files = dt.files
                startGeometrize(files)
            }
        }
        function constructScreen2() {
            Console.log("Constructing screen 2", 'Geom')

            var configActive = false;

            const iconPause = "url(" + chrome.runtime.getURL("assets/module-assets/geom-pause.png") + ")"
            const iconPlay = "url(" + chrome.runtime.getURL("assets/module-assets/geom-play.png") + ")"
            const o = {};

            o.body = setAttributes(document.createElement("div"),  { class: "geom-carpet", style: "display: none;", parent: body })
            o.echo = setAttributes(document.createElement("div"),     { id: "geom-echo", class: "hover-button canvas-in-square", parent: o.body })
            o.back = setAttributes(document.createElement("div"), { id: "geom-reselect", class: "geom-border hover-button", parent: o.echo })
            o.tray = setAttributes(document.createElement("div"),     { id: "geom-lower-tray", class: "canvas-square-lower-tray", parent: o.body })
            o.sendStack = setAttributes(document.createElement("div"),   { class: "geom-stack", parent: o.tray })
            o.sendLabel = setAttributes(document.createElement("label"),   { class: "geom-status", parent: o.sendStack })
            o.sendPauser = setAttributes(document.createElement("button"), { class: "geom-border geom-tray-button hover-button", parent: o.sendStack })
            o.genStack = setAttributes(document.createElement("div"),   { class: "geom-stack", parent: o.tray })
            o.genLabel = setAttributes(document.createElement("label"),  { id: "geom-total", class: "geom-status", parent: o.genStack })
            o.genPauser = setAttributes(document.createElement("button"),  { class: "geom-border geom-tray-button hover-button", parent: o.genStack })

            o.sendPauser.addEventListener("click", () => { o.setSendPause(!Geom.flags.pause) })
            o.sendPauser.style.backgroundImage = iconPlay;
            o.back.addEventListener("click", () => { stopGeometrize() }) // TODO put a semi-transparent negative space cancel icon instead of hover-button
            o.genPauser.addEventListener("click", () => { o.setGenPause(Geom.flags.generate) })
            o.genPauser.style.backgroundImage = iconPause;
            o.genLabel.addEventListener("click", () => { o.setGeomConfigWindow(!configActive) })

            o.updateLabel = function(which, newValue) {
                if (which == 'total') { o.genLabel.textContent = newValue }
                else if (which == 'sent') { o.sendLabel.textContent = newValue }
                else if (which == 'both') { o.genLabel.textContent = newValue; o.sendLabel.textContent = newValue }
            }
            o.setSendPause = function(pause) { 
                Console.log("Send " + (pause ? 'paused' : 'play'), 'Geom')
                if (!Geom.flags.mode) {
                    o.sendPauser.style.backgroundImage = iconPlay
                    return
                } 
                o.sendPauser.style.backgroundImage = pause ? iconPlay : iconPause
                Geom.flags.pause = pause
                if (!pause) { Geom.trySend() }
            }
            o.setGenPause = function(pause) {
                Console.log("Gen " + (pause ? 'paused' : 'play'), 'Geom')
                o.genPauser.style.backgroundImage = pause ? iconPlay : iconPause
                Geom.flags.generate = !pause
            }
            o.setGeomConfigWindow = function(active) {
                configActive = active
                geomScreen3 = geomScreen3 || constructScreen3()
                geomScreen3.body.style.display = active ? 'flex' : 'none';
            }

            return o;
        }
        function constructScreen3() {
            Console.log("Constructing screen 3", 'Geom')

            const o = {};

            o.body = setAttributes(document.createElement("div"),          { id: "geom-config", parent: body })
            o.distEntry = setAttributes(document.createElement("div"),     { class: "geom-3-hstack", parent: o.body })
            o.distIcon = setAttributes(document.createElement("img"),     { class: "geom-3-icon", parent: o.distEntry })
            o.distInput = setAttributes(document.createElement("input"), { class: "geom-3-input", parent: o.distEntry })
            o.maxEntry = setAttributes(document.createElement("div"),      { class: "geom-3-hstack", parent: o.body })
            o.maxIcon = setAttributes(document.createElement("img"),     { class: "geom-3-icon", parent: o.maxEntry  })
            o.maxInput = setAttributes(document.createElement("input"), { class: "geom-3-input", parent: o.maxEntry  })
    
            o.distIcon.src = chrome.runtime.getURL("assets/module-assets/geom-3d.png")
            o.distInput.value = Geom.config.distance
            o.distInput.addEventListener("blur", () => { 
                const newValue = +o.distInput.value
                if (isNaN(newValue) || newValue < 1) { o.distInput.value = Geom.config.distance; return }
                Geom.config.distance = newValue;
                Console.log("Config dist set to " + newValue, 'Geom')
            })
            o.maxIcon.src = chrome.runtime.getURL("assets/module-assets/geom-3m.png")
            o.maxInput.value = Geom.config.max
            o.maxInput.addEventListener("blur", () => { 
                const newValue = +o.maxInput.value
                if (isNaN(newValue) || newValue < 1) { o.maxInput.value = Geom.config.max; return }
                if (newValue < Geom.counters.created) { o.maxInput.value = Geom.counters.created; /* return; */}
                Geom.config.max = newValue;
                Console.log("Config max set to " + newValue, 'Geom')
            })

            return o;
        }

        Geom.geomWIW = newWIW

        return { 
            pause: (newState) => { if (geomScreen2) { geomScreen2.setSendPause(newState) } }, 
            stop: () => stopGeometrize(), 
            label: (which, newValue) => { geomScreen2.updateLabel(which, newValue) }
        }

        function stopGeometrize() {
            geomScreen2 = geomScreen2 || constructScreen2()
            geomScreen3 = geomScreen3 || constructScreen3()

            geomScreen1.body.style.display = 'flex';
            geomScreen2.body.style.display = 'none'; // TODO lazy init
            geomScreen3.body.style.display = 'none';
            // other stopping stuff
            geomScreen2.setSendPause(false) 
            clearTimeout(Geom.stepCallback)
        }
        function startGeometrize(files) { // [G1]
            geomScreen2 = geomScreen2 || constructScreen2()

            const dataURL = URL.createObjectURL(files.item(0))
            geomScreen1.body.style.display = 'none';
            geomScreen2.body.style.display = 'flex'; // TODO lazy init
            geomScreen2.echo.style.backgroundImage = "url(" + dataURL + ")"

            geomScreen2.setGenPause(false)
            geomScreen2.updateLabel('both', 0)
            Geom.counters = { created:0, sent:0 }
            Geom.shapeQueue = [];
            Geom.flags.queue = false;

            const img = new Image();
            img.src = dataURL;
            img.onload = function() {
                Geom.geometrize(img)
            };
        }
    },
    async geometrize(img) {
        const resizedDimensions = view_fit(758, 424, img.naturalWidth, img.naturalHeight) 
        const canvas = setAttributes(document.createElement("canvas"), { width:resizedDimensions.x, height: resizedDimensions.y });
        const context = canvas.getContext("2d");
        //Debug.log(Geom, resizedDimensions)
        context.drawImage(img, resizedDimensions.margin.x / 2, resizedDimensions.margin.y / 2, resizedDimensions.x, resizedDimensions.y);
        const imgdata = context.getImageData(0, 0, 758, 424)

        Geom.queryGW("set", { width: 758, height: 424, data: imgdata.data }).then((response) => {
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
        function view_fit(minx, miny, elementx, elementy) {
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
        async function step() {
            if (!Geom.flags.generate || Geom.counters.created >= Geom.config.max || Geom.counters.created - Geom.counters.sent >= Geom.config.distance) { 
                _ = await Geom.queryGW(2)
                Geom.stepCallback = setTimeout(step, 250); 
                return 
            }
            const shape = await Geom.queryGW("step")
            if (shape === undefined) { Console.alert("Mysterious error, no shape was produced; terminating", 'Geom'); return }     
            Console.log(shape, 'Worker')       
            Geom.queueShape(shape)
            step() 
        }
    },
    setSendPause(newState) {},          // Dynamically initialized
    stopGeometrize() {},                // Dynamically initialized
    updateLabel(which, newValue) {},    // Dynamically initialized
    queueShape(shape) {
        Geom.counters.created += 1
        Geom.shapeQueue.push(shape)
        Geom.flags.queue = true
        Geom.updateLabel('total', Geom.counters.created)
      
        setTimeout(Geom.trySend, 0) // Maybe an overcomplication
    },
    trySend() {
        function gartic_format(shape) {
            const raw = shape.raw
            const type = shape.type == 0 ? 6 : 7 
            const color = (function(){
                const signed = shape.color
                const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
                const colora = unsigned.toString(16).padStart(8, '0')
                return colora.slice(0,6)
            })()
        
            var coords;
            if (type == 6) {
                coords = raw
            }
            else if (type == 7) {
                coords = [raw[0] - raw[2], raw[1] - raw[3], raw[0] + raw[2], raw[1] + raw[3]]
            } // else if LINE
        
            return { fst: '42[2,7,{"t":0,"d":1,"v":[' + type + ',',
                    snd: ',["#' + color + '",2,"0.5"],['
                    + coords[0] + ',' + coords[1]
                    + '],['
                    + coords[2] + ',' + coords[3]
                    + ']]}]'}
        }
        function svg_format(shape) {
            const raw = shape.raw
            const type = shape.type == 0 ? 'rect' : 'ellipse'
            const color = "#" + (function(){
                const signed = shape.color
                const unsigned = signed > 0 ? signed : signed + 0xFFFFFFFF + 1
                const colora = unsigned.toString(16).padStart(8, '0')
                return colora.slice(0,6)
            })()
        
            var coords;
            if (type == 'rect') {
                coords = { x: raw[0], y: raw[1], width: raw[2] - raw[0], height: raw[3] - raw[1] }
            }
            else if (type == 'ellipse') {
                coords = { cx: raw[0], cy: raw[1], rx: raw[2], ry: raw[3]}
            } // else if LINE
        
            return setAttributes(document.createElementNS(svgNS, type), { ...coords, fill: color, "fill-opacity": "0.5" })
        }

        // console.log(Geom.flags)

        if(Geom.flags.notClearToSend()) { return }
        Geom.flags.interval = false
        setTimeout(() => { Geom.flags.interval = true; Geom.trySend() }, 125)
        
        shape = Geom.shapeQueue.shift()
        if(Geom.shapeQueue.length == 0) { Geom.flags.queue = false }
        packet = gartic_format(shape)
        svg = svg_format(shape)
        
        Socket.post('sendGeomShape', packet)
        Geom.counters.sent += 1
        Geom.geomPreview.appendChild(svg)
        Geom.updateLabel('sent', Geom.counters.sent)
    },
    async queryGW(purpose, data=undefined) {
        const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
        const response = await chrome.runtime.sendMessage(message);
        Console.log(response, 'Worker') 
        return response
    },
}
Object.setPrototypeOf(Geom, CellulartModule)



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
    //     new Keybind((e) => e.code == "T" , (e) => { Triangle.beginDrawingFullTriangle() }),
    //     new Keybind((e) => e.code == "K" , (e) => { Triangle.beginDrawingFrameTriangle() }),
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
    // adjustGameParameters(parameters) {},

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
  * (WIP) This module is not initialized by Controller.
  * ---------------------------------------------------------------------- */
const Reveal = {

    name : "Reveal",
    isCheat : true,
    setting : new RedSettingsBelt('off'), // SettingsBelt(["OFF", "TEXT"], 0, "ALL"), // [V2]

    hiddenElements : undefined,

    // init(modules) {}, // Empty.
    mutation(oldPhase, newPhase) {
        if (Reveal.setting.current() == "OFF") { return; }
        if (newPhase == "write" || newPhase == "first") {
            Reveal.revealPrompt()
        } else if (Reveal.setting.current() == "ALL" && newPhase == "draw") {
            Reveal.revealDrawing()
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
            case "OFF": Reveal.rehide(); break;
            case "TEXT": Reveal.revealPrompt(); break;
            case "ALL": Reveal.revealDrawing(); break;
        }
    },
    // adjustGameParameters(parameters) {},

    revealPrompt() {
        Reveal.hiddenElements = document.querySelector(".center").querySelectorAll(".hiddenMode")
        Reveal.hiddenElements.forEach(n => n.style.cssText = "font-family:Bold; -webkit-text-security: none")
    },
    revealDrawing() {
        Reveal.hiddenCanvases = document.querySelector(".drawingContainer").querySelectorAll("canvas");
        Reveal.hiddenCanvases[1].addEventListener("mouseup", e => {
            const newwiw = WIW.newWIW(true, true);
            setAttributes(new Image(), { class: "wiw-img", parent: newwiw.children[1], src: Reveal.hiddenCanvases[0].toDataURL() })
        })
        // [V3]
    },
    rehide() {
        Reveal.hiddenElements.forEach(n => n.style.cssText = "");
        // [V3]
    }

    // animate the black cover lifting to gray [V3]
}
Object.setPrototypeOf(Reveal, CellulartModule)

// #endregion


// console.log(Object.keys(window))
if (typeof exports !== 'undefined') {
    module.exports = { Debug, Red, Timer, Koss, Refdrop, Spotlight, Geom, Triangle, Reveal };
}
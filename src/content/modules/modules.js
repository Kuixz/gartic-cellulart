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




// #endregion



/////////////////////////////// #region Modules ///////////////////////////////













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
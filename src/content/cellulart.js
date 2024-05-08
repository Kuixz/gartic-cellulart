 /* ----------------------------------------------------------------------
  *                         Cellulart BETA 1.1.3
  *                           Created by Quoi3
  * Please send any concerns, errors, reviews, and feedback to Quixz#0033 
  *    And please don't stare like that!! It's embarrassing (,,>﹏<,,) 
  * ---------------------------------------------------------------------- */ 
const Controller = { 
    
    menu: null, // [C1]
    modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    keybinds: Keybinder,
    auth: SHAuth.using(Shelf),

    init() {
        WIW.constructWIWNode();
        Controller.keybinds.init()
        Socket.init()
        XHR.init()

        Controller.initPopupAuth()
        Controller.createMenu()
        // Socket.addMessageListener('strokeCount', (data) => {
        //     console.log('Stroke count set to ' + data)
        //     Shelf.set({ strokeCount:data })
        // })
    },
    mutation (oldPhase, newPhase) {
        Controller.modules.forEach(mod => mod.mutation(oldPhase, newPhase))
    },
    backToLobby(oldPhase) {
        Socket.post("backToLobby")
        // Shelf.set({ strokeCount:data }) // Possibly redundant? Will have to test.
        Controller.modules.forEach(mod => mod.backToLobby(oldPhase))
    },

    initPopupAuth() {
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            // console.log(message)
            if (message == "status") { sendResponse({open: Controller.auth.validated}) } else { Controller.authenticate(message, sendResponse) }
            return true
        });
    },
    async createMenu() {
        var hiddenButtons = []
        var unlock = new SettingsBelt(['on', 'red'])

        green = !(await Controller.auth.tryLogin())
        createMenuButtons(green)
        if (green) { Controller.unhide = unhide }

        function createMenuButtons(green) {
            Controller.menu = setAttributes(document.createElement("div"), { id: "cellulart-menu", parent: document.body })
            // createButton(
            //     collapse
            // )
            Controller.modules.forEach((mod) => { 
                mod.init(Controller.modules)
                if (mod.setting) { createModuleButton(mod, green) } 
                if (mod.keybinds) { Controller.keybinds.add(mod.keybinds) }
            })
        }
        function createModuleButton(mod, green) {
            createButton(
                mod.name.toLowerCase() + "_" + mod.setting.current(),
                function() { return mod.name.toLowerCase() + "_" + mod.menuStep() },
                mod.isCheat && green
            )
        }
        function createButton(defaultPicture, onclick, hidden){
            const item = setAttributes(document.createElement("div"), { class: "cellulart-menu-item" })
            const itemIcon = setAttributes(document.createElement("img"), { class: "cellulart-circular-icon", src: chrome.runtime.getURL("assets/menu-icons/" + defaultPicture + ".png"), parent: item })
            item.addEventListener("click", () => { 
                const res = onclick(); 
                itemIcon.src = chrome.runtime.getURL("assets/menu-icons/" + res + ".png") 
            })
            if (hidden) { hiddenButtons.push(item); item.style.display = "none" } 
            Controller.menu.appendChild(item)
        }
        function unhide() {
            hiddenButtons.forEach((button) => {
                button.style.display = "initial"; 
            })
            hiddenButtons = undefined
        }
    },
    async authenticate(message, sendResponse) {
        const correct = await Controller.auth.authenticate(message)
        if (correct) { Controller.unhide(); }
        sendResponse({open: correct})
    }
}   // [C2]

const Observer = { 
    name: "Observer",
    content: undefined,
    currentPhase: "start",
    
    init() { 
        Observer.attachContentObserver(); 
        // Socket.addMessageListener('settings', Observer.adjustSettings)
        XHR.addMessageListener('lobbySettings', Observer.deduceSettingsFromXHR)
    },
    mutation(newPhase) {
        const oldPhase = Observer.currentPhase
        Observer.currentPhase = newPhase
        Console.log(newPhase, Observer)

        // Handle special cases
        if (newPhase == "waiting") { Observer.waiting(); return; } 
        if (newPhase == "lobby")   { Observer.backToLobby(oldPhase); return; } 

        Controller.mutation(oldPhase, newPhase)
    },
    backToLobby(oldPhase) {
        Observer.nextObserver.observe(document.querySelector("#__next"), configChildTrunk); 
        Controller.backToLobby(oldPhase) 
    },

    waiting() { Console.log("Waiting", Observer) }, // [C4]

    // adjustSettings(data) {
    //     // if (data.slice(0,2) != '42') { return }
    //     // const settings = JSON.parse(data.slice(2))
    //     // const settingType = settings[1]
    //     // 26 is preset
    //     // 27 is change
    //     // 18 is edit
    //     // Fuck this, just reuse the original observer logic
    //     // if (settingType == 26) {
    //     //     const mode = settings[2]
    //     //     game.mode = mode
    //     //     game.parameters = modeParameters[mode] ?? modeParameters[1]
    //     // }
    //     // else if (settingType == 27) {
    //     //     game.mode = 'CUSTOM'
    //     // }
    //     // else if (settingType == 18) {
    //     //     // const left = document.querySelector(".left")
    //     //     // const players = Number(left.firstChild.textContent.slice(7, -3)) // : document.querySelector(".step").textContent.slice(2))
         
    //     //     const encodedSettings = settings[2]
    //     //     if (encodedSettings['speed']) { 
    //     //         ({
    //     //             1: [80, 300, 1.25, 2]
    //     //         })[encodedSettings['speed']]
    //     //         game.parameters['write'] = [0,80,40,20][encodedSettings['speed']] 
    //     //         game.parameters['draw'] = [0,80,40,20][first] 
    //     //         game.parameters['firstMultiplier'] = [0,80,40,20][first] 
    //     //         game.parameters['fallback'] = [0,80,40,20][first] 
    //     //         game.parameters['decay'] = 1
    //     //     } else if (encodedSettings['first']) { 
    //     //         // const first = encodedSettings['first']
    //     //         // game.parameters['fallback'] = 1
    //     //     }
    //     // }
    // },

    nextObserver: new MutationObserver((records) => {     
        // todo: add a button to manually reattach the lobby observer in popup, if I try to disconnect the observer early.

        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }

        const left = document.querySelector(".left")
        const players = Number(left.firstChild.textContent.slice(7, -3)) // : document.querySelector(".step").textContent.slice(2))
        
        try {
            // if in lobby, check for the apperance of the start of round countdown and when it appears, update the current gamemode variable.
            const mode = document.querySelector(".checked").querySelector("h4").textContent;
            Object.assign(game, modeParameters[mode]);
            switch (mode) {
                case "ICEBREAKER":  game.turns = players + 1; break;
                case "MASTERPIECE": game.turns = 1;           break;
                case "CROWD":       game.turns = players / 2; break;
                case "KNOCK-OFF":   game.decay = Math.exp(8 / players); 
                default:            game.turns = players;     break;
            }
        } catch { 
            // if the current gamemode variable is not found by searching for .checked, then each piece must be assigned separately.
            const gameConfig = {};
            const gameEncodedConfig = document.querySelector(".config").querySelectorAll(".select");
            // console.log(gameEncodedConfig);
            ;[0,1,2].forEach( num => { 
                try { const select = gameEncodedConfig[num].querySelector("select"); 
                        gameConfig[num] = select.childNodes[select.selectedIndex].textContent; }
                catch { gameConfig[num] = gameEncodedConfig[num].childNodes[0].textContent;    }
            } )
            game.turns = turns()
            switch (gameConfig[0]) { // Setting custom game.parameters
                case "SLOW":              Object.assign(game, { "write": 80, "draw": 300, 'decay': 0, "firstMultiplier": 1.25 }); break;
                case "NORMAL":            Object.assign(game, modeParameters["NORMAL"]); break;
                case "FAST":              Object.assign(game, modeParameters["SECRET"]); break;
                case "PROGRESSIVE":       Object.assign(game, { "write": 8, "draw": 30 , "decay": Math.exp(8 / game.turns), "firstMultiplier": 1}); break;
                case "REGRESSIVE":        Object.assign(game, { ...modeParameters['KNOCK-OFF'], decay: 1 / Math.exp(8 / game.turns) }); break;
                case "DYNAMIC":           Object.assign(game, modeParameters["SOLO"]); break;
                case "INFINITE":          Object.assign(game, modeParameters["SOLO"]); break;
                case "HOST'S DECISION":   Object.assign(game, modeParameters["SOLO"]); break;
                case "FASTER FIRST TURN": Object.assign(game, modeParameters["COMPLEMENT"]); break;
                case "SLOWER FIRST TURN": Object.assign(game, modeParameters["BACKGROUND"]); break;
                default: console.log("[Cellulart] ERROR: Could not identify the time setting being used")
            }
            switch (gameConfig[1]) { 
                case "WRITING, DRAWING":                     game.fallback = 2;
                case "DRAWING, WRITING":                     game.fallback = 2;
                case "SINGLE SENTENCE":                      game.fallback = -1;
                case "SINGLE DRAWING":                       game.fallback = -1;
                case "DRAWINGS WITH A BACKPACK":             game.fallback = -1;
                case "DRAWINGS WITH A BACKPACK, NO PREVIEW": game.fallback = -1;
                default:                                     game.fallback = 1;
            }
            function turns() { // Finding custom turn count for PROGRESSIVE / REGRESSIVE by taking Turns setting into account
                switch (gameConfig[2]) {
                    case "FEW":         return Math.floor(players / 2);     // [C3]
                    case "MOST":        return Math.floor(3 * players / 4); // [C3]
                    case "ALL":         return players; 
                    case "ALL +1":      return players + 1;
                    case "200%":        return 2 * players;
                    case "300%":        return 3 * players;
                    case "SINGLE TURN": return 1;
                    case "2 TURNS":     return 2;
                    case "3 TURNS":     return 3;
                    case "4 TURNS":     return 4;
                    case "5 TURNS":     return 5;
                    case "6 TURNS":     return 6;
                    case "7 TURNS":     return 7;
                    case "8 TURNS":     return 8;
                    case "9 TURNS":     return 9;
                    case "10 TURNS":    return 10;
                    case "20 TURNS":    return 20;
                    default: console.log("[Cellulart] ERROR: Could not identify the turn setting being used"); return 0;
                }
            }
            // console.log(gameConfig)
        }
    }),

    contentObserver: new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        Observer.nextObserver.disconnect()

        // game.user = document.querySelector(".users").querySelector("i").parentNode.nextSibling.textContent
        // switch (game.mode) {
        //     case "ICEBREAKER":  game.turns = players + 1; break;
        //     case "MASTERPIECE": game.turns = 1;           break;
        //     case "CROWD":       game.turns = players / 2; break;
        //     case "KNOCK-OFF":   game.decay = Math.exp(8 / game.turns); 
        //     default:            game.turns = players;     break;
        // }

        Observer.mutation(Observer.content.firstChild.firstChild.classList.item(1))
    }),

    attachContentObserver() {
        var frame = document.querySelector("#content");
        if (!frame) {
            setTimeout(Observer.attachContentObserver, 500);
            Console.log('Waiting for target node', Observer)
            return
        }
        Observer.contentObserver.observe(frame, configChildTrunk);
        console.log("[Cellulart] Successfully attached observer");
        Observer.content = frame;
    },

    deduceSettingsFromXHR(data) {
        console.log(data)
    }
}



function main() {
    // sandbox()

    Controller.init()
    Observer.init()

    // document.querySelector(".side").remove() // lol
    document.querySelector(".side").style.display = "none" 
}
document.readyState === 'complete' ? main() : window.addEventListener('load', (e) => main());

// function sandbox() {
//     chrome.webRequest.onBeforeRequest.addListener(
//         (details) => { console.log(details) }
//     )
// }
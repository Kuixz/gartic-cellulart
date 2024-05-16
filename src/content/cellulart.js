const { Converter } = require("./foundation");

 /* ----------------------------------------------------------------------
  *                         Cellulart BETA 1.2.0
  *                           Created by Quoi3
  * Please send any concerns, errors, reviews, and feedback to Quixz#0033 
  *    And please don't stare like that!! It's embarrassing (,,>﹏<,,) 
  * ---------------------------------------------------------------------- */ 
const Controller = { 
    
    menu: null, // [C1]
    modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    auth: SHAuth.using(Shelf),

    init() {
        WIW.constructWIWNode();
        Keybinder.init()
        Socket.init()
        Xhr.init()

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
        // Socket.post("backToLobby")
        Socket.backToLobby()
        // Shelf.set({ strokeCount:data }) // Possibly redundant? Will have to test.
        Controller.modules.forEach(mod => mod.backToLobby(oldPhase))
    },
    // adjustSettings(previous, current) {},
    update42(type, data) {
        Controller.modules.forEach(mod => mod.update42(type, data))
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
                if (mod.keybinds) { Keybinder.add(mod.keybinds) }
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

/* Normal: {
    "tab": 1, means PRESET
    "maxUsers": 14,
    "mod": 2,
    "mode": 1,
    "visible": 1,
    "speed": 2,
    "turns": 3,
    "first": 1,
    "score": 2,
    "animate": 2,
    "keep": 2
} */
/* KO: {
    "tab": 1,
    "maxUsers": 14,
    "mod": 2,
    "mode": 8,
    "visible": 1,
    "speed": 5,
    "turns": 3,
    "first": 3,
    "score": 2,
    "animate": 2,
    "keep": 2
} */
/* KO Custom Menu {
    "tab": 2, means CUSTOM MENU
    "maxUsers": 14,
    "mod": 2, means OFF
    "mode": 8,
    "visible": 1,
    "speed": 5,
    "turns": 3,
    "first": 3, could be ONLY DRAWINGS
    "score": 2, means OFF
    "animate": 2, means OFF
    "keep": 2
} */
/* Fiddled Settings {
    "tab": 2,
    "maxUsers": 14,
    "mod": 1, means ON
    "mode": 8,
    "visible": 2, could be SECRECY
    "speed": 7,  could be TIME (Host Decision)
    "turns": 15, apparently means 8 TURNS
    "first": 9, could be SOLO DRAWING
    "score": 1, means Score ON
    "animate": 1, means Animation ON
    "keep": 2, means keep drawing OFF
} */
/* More or less Normal {
    "tab": 2,
    "maxUsers": 14,
    "mod": 1,
    "mode": 8,
    "visible": 2,
    "speed": 2, could be NORMAL
    "turns": 6, means SINGLE TURN
    "first": 1, could be WRITING, DRAWING
    "score": 1,
    "animate": 1,
    "keep": 1, means keep drawing ON
} */
/* MASTERPIECE {
    "tab": 1,
    "maxUsers": 14,
    "mod": 2,
    "mode": 20, TWENTY?!?!?
    "visible": 1,
    "speed": 7,
    "turns": 6, 
    "first": 9,
    "score": 2,
    "animate": 2,
    "keep": 2
} */
/* COMPLEMENT Custom Menu {
    "tab": 2,
    "maxUsers": 14,
    "mod": 2,
    "mode": 15,
    "visible": 1,
    "speed": 9, Faster First
    "turns": 12, ALL +1
    "first": 11, Drawing with a Background, No Preview
    "score": 2,
    "animate": 2,
    "keep": 2
} */

// 27: switch screens, 26: switch default settings, 18: custom settings, 24: end game, 15: turn end update,
// 11: transition (with turnNum property), 5: round start (3rd entry is player count), 9: book event, 23: book begins, 12: book next timeline, 20: back to lobby

const Observer = { 
    name: "Observer",
    content: undefined,
    currentPhase: "start",
    
    init() { 
        Observer.attachContentObserver(); 
        // Socket.addMessageListener('gameEvent', Observer.deduceSettingsFromSocket)
        // Socket.addMessageListener('gameEventScreenTransition', Observer.deduceSettingsFromSocket)
        Socket.addMessageListener('update42', Observer.deduceSettingsFromSocket)
        Xhr.addMessageListener('lobbySettings', Observer.deduceSettingsFromXHR)
        // Xhr.addMessageListener('lobbySettings', Timer.deduceSettingsFromXHR)
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
    // },

    nextObserver: new MutationObserver((records) => {     
        // todo: add a button to manually reattach the lobby observer in popup, if I try to disconnect the observer early.

        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        Observer.deduceSettingsFromDocument()
    }),
    contentObserver: new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        Observer.nextObserver.disconnect()

        Observer.mutation(Observer.content.firstChild.firstChild.classList.item(1))
    }),
    attachContentObserver() {
        var frame = document.querySelector("#content");
        if (!frame) {
            setTimeout(Observer.attachContentObserver, 500);
            Console.log('Waiting for target node', 'Observer')
            return
        }
        Observer.contentObserver.observe(frame, configChildTrunk);
        Console.log("Successfully attached observer", 'Observer');
        Observer.content = frame;
    },

    deduceSettingsFromXHR(data) {
        Console.log(data, 'Observer')
        // const config = data.configs

        // if (config.tab == 1) { 
        //     Console.log("XHR can use presets", 'Observer')
        //     try {
        //         const preset = Converter.modeIndexToString(config.mode)
        //         Object.assign(game, modeParameters[preset]);
        //         Timer.rejoinInterpolate(data.turnNum)
        //         return
        //     } catch {
        //         Console.alert('This is an unknown preset, defaulting to piecewise assignment', 'Observer')
        //     }
        // }
        // Console.log("XHR can't use presets", 'Observer')
        // data.configs.mode = Converter.modeIndexToString(data.configs.mode)
        // data.configs.first = Converter.flowIndexToString(data.configs.first)
        // Converter.setMode('CUSTOM')
        // TODO: add piecewise assignment here
        // game.turns = Converter.turnsStringToFunction(gameConfig[2])(players) 
        // Object.assign(game, Converter.timeStringToParameters(gameConfig[0]))
        // game.fallback = Converter.flowStringToFallback(gameConfig[1])

        if (data.turnMax > 0) {
            // todo: in theory we should pass these through to all the modules, but ehh.
            // game.turns = data.turnMax
            // Timer.interpolate(data.turnNum)
            Socket.post('setStrokeStack', data.draw)
        }
        Controller.update42(1, data)
        // Controller.update42(data[0], data[1])
    },
    deduceSettingsFromSocket(data) {
        // console.log(data)
        Controller.update42(data[1], data[2])
        // if (data[1] == 5) {
            // game.turns = data[2]  // it's not that easy...
        //     game.turns = Converter.turnsStringToFunction(/* TODO TODO TODO */)(data[2])
        // }
    },
    deduceSettingsFromDocument() {
        // TODO: move as much of this as possible to Converter / Timer.

        const left = document.querySelector(".left")
        const players = Number(left.firstChild.textContent.slice(7, -3)) // : document.querySelector(".step").textContent.slice(2))
        
        /*
        try {
            // if in lobby, check for the apperance of the start of round countdown and when it appears, update the current gamemode variable.
            const mode = document.querySelector(".checked").querySelector("h4").textContent;
            Object.assign(game, Converter.getParameters(mode));
            switch (mode) {
                case "ICEBREAKER":  game.turns = players + 1; break;
                case "MASTERPIECE": game.turns = 1;           break;
                case "CROWD":       game.turns = players / 2; break;
                case "KNOCK-OFF":   game.decay = Math.exp(8 / players); game.turns = players; break;
                default:            game.turns = players;     break;
            }
        } catch { 
            // if the current gamemode variable is not found by searching for .checked, then each piece must be assigned separately.
            const gameConfig = {};
            const gameEncodedConfig = document.querySelector(".config").querySelectorAll(".select");
            // console.log(gameEncodedConfig);
            [0,1,2].forEach((num) => { 
                try { const select = gameEncodedConfig[num].querySelector("select"); 
                        gameConfig[num] = select.childNodes[select.selectedIndex].textContent; }
                catch { gameConfig[num] = gameEncodedConfig[num].childNodes[0].textContent;    }
            })
            game.turns = Converter.turnsStringToFunction(gameConfig[2])(players) 
            Object.assign(game, Converter.timeStringToParameters(gameConfig[0]))
            game.fallback = Converter.flowStringToFallback(gameConfig[1])
        }
        */
    },
    // TODO: Get phase transition data from Socket
}



function main() {
    // sandbox()

    Controller.init()
    Observer.init()

    // document.querySelector(".side").remove() // lol
    var side = document.querySelector(".side"); if (side) { side.style.display = "none" }
}
document.readyState === 'complete' ? main() : window.addEventListener('load', (e) => main());

// function sandbox() {
// 
// }

if (typeof exports !== 'undefined') {
    module.exports = { Controller, Observer };
}
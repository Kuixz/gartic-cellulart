// const dogSrc: string = 'https://media.tenor.com/fej4_qoxdHYAAAAM/cute-puppy.gif'
import { 
    Phase, Console, Converter, GarticXHRData, 
    Keybinder, Setting, SHAuth,
    Socket,
    // IAuth, SHAuth as SHAuth, 
    IShelf, SandShelf as Shelf,
    setAttributes, setParent, configChildTrunk, globalGame, 
} from "./foundation"
import { Timer, Koss, Refdrop, Spotlight, Geom } from "./modules"
import { Red, Debug } from "./metamodules"
import { 
    ModuleLike, CellulartModule, Metamodule,
    ModuleChamber, MetaChamber
} from "./modules/CellulartModule"

class Controller { 
    // static name: Controller
    menu: HTMLElement | undefined // [C1]
    liveModules: CellulartModule[] = []
    liveMetamodules: Metamodule[] = []
    // modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    auth: SHAuth /*IAuth*/ = new SHAuth(new Shelf())

    constructor(
        // auxmodules: AuxChamber,
        modules: ModuleChamber, 
        metamodules: MetaChamber,
    ) {
        // Keybinder.init()
        Socket.init()
        // Xhr.init()

        this.initPopupAuth()

        this.createMenu(modules, metamodules)
        // this.liveModules = this.createMenu(modules, metamodules)

        // Socket.addMessageListener('strokeCount', (data) => {
        //     console.log('Stroke count set to ' + data)
        //     Shelf.set({ strokeCount:data })
        // })
    }
    mutation (oldPhase: Phase, newPhase: Phase) {
        this.liveModules.forEach(mod => mod.mutation(oldPhase, newPhase))
    }
    roundStart() {
        // game.roundStart()
        this.liveModules.forEach(mod => mod.roundStart())
    }
    roundEnd(oldPhase: Phase) {
        // Socket.post("backToLobby")
        // Socket.roundEnd()
        // Shelf.set({ strokeCount:data }) // Possibly redundant? Will have to test.
        this.liveModules.forEach(mod => mod.roundEnd(oldPhase))
    }

    initPopupAuth() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // console.log(message)
            if (message == "status") { 
                sendResponse({open: this.auth.validated}) 
            } else { 
                this.authenticate(message, sendResponse) 
            }
            return true
        });
    }
    unhide() {}
    async createMenu(  // TODO separate into two functions: initialize ([], [], []) and createMenu([], [])
        // auxmodules: AuxChamber,
        modules: ModuleChamber, 
        metamodules: MetaChamber,
    ){  // TODO don't initalize all immediately, maybe? because some people will never use the RED mode
        var hiddenButtons: HTMLElement[] = []
        function unhide() {
            hiddenButtons.forEach((button) => {
                button.style.display = "initial"; 
            })
            hiddenButtons = []
        }

        // const green = !(await Controller.auth.tryLogin())
        const green = false
        const menu = createMenuElement()
        modules.forEach((modTemplate: typeof CellulartModule) => { 
            const mod = new (modTemplate as new() => CellulartModule)()
            this.liveModules.push(mod)
            menu.appendChild(createModuleButton(mod, green))
            // if (mod.setting) { createModuleButton(mod, green) } 
            // if (mod.keybinds) { Keybinder.add(mod.keybinds) }
        })
        metamodules.forEach((modTemplate: typeof Metamodule) => { 
            const mod = new (modTemplate as new(modules: CellulartModule[]) => Metamodule)(this.liveModules)
            this.liveMetamodules.push(mod)
            menu.appendChild(createModuleButton(mod, green))
            // if (mod.setting) { createModuleButton(mod, green) } 
            // if (mod.keybinds) { Keybinder.add(mod.keybinds) }
        })

        this.menu = menu
        if (green) { this.unhide = unhide }

        function createMenuElement () {
            const menu = document.createElement("div")
            setAttributes(menu, { id: "cellulart-menu" })
            setParent(menu, document.body)
            return menu
        }
        function createModuleButton (mod: ModuleLike, green: boolean): HTMLElement {
            return createButton(
                mod.setting.current.assetPath,
                // mod.name.toLowerCase() + "_" + mod.setting.current,
                function() { return mod.menuStep() },
                mod.isCheat && green
            )
        }
        function createButton (defaultPicture: string, onclick: () => Setting, hidden: boolean): HTMLElement {
            const item = document.createElement("div")
            setAttributes(item, { class: "cellulart-menu-item" })

            const itemIcon = document.createElement("img")
            setAttributes(itemIcon, { class: "cellulart-circular-icon", src: defaultPicture })  // getResource("assets/menu-icons/" + defaultPicture + ".png")]])
            setParent(itemIcon, item)

            item.addEventListener("click", function() { 
                const newSetting = onclick(); 
                itemIcon.src = newSetting.assetPath
            })
            if (hidden) { hiddenButtons.push(item); item.style.display = "none" } 
            return item
        }
    }
    async authenticate(message: string, sendResponse: (response?: any) => void ) {
        const correct = await this.auth.authenticate(message)
        if (correct) { this.unhide(); }
        sendResponse({open: correct})
    }
}   // [C2]

class Observer { 
    // static name: string = "Observer"
    content: Element | undefined
    controller: Controller
    
    constructor(controller: Controller) {
        this.controller = controller;
        // Socket.addMessageListener('gameEvent', Observer.deduceSettingsFromSocket)
        // Socket.addMessageListener('gameEventScreenTransition', Observer.deduceSettingsFromSocket)
        // Socket.addMessageListener('updateLobbySettings', Observer.deduceSettingsFromSocket)
        // Xhr.addMessageListener('lobbySettings', Observer.deduceSettingsFromXHR)
        // Xhr.addMessageListener('lobbySettings', Timer.deduceSettingsFromXHR)
    }
    mutation(newPhase: Phase): void {
        // Set variables
        const oldPhase = globalGame.currentPhase
        globalGame.currentPhase = newPhase
        Console.log(`Transitioned to ${newPhase}`, "Observer")

        globalGame.currentTurn = (function():number {
            if (["first", "draw", "write", "memory", "mod"].includes(newPhase)) {
                const step = document.querySelector(".step")
                if (!step) { Console.alert("Could not find turn counter", "Observer"); return -1 }
                if (!(step.textContent)) { Console.alert("Could not read turn counter", "Observer"); return -1 }

                const slashIndex = step.textContent.indexOf("/")
                const turnCount = Number(step.textContent.slice(0, slashIndex))
                if (isNaN(turnCount)) { Console.alert("Could not parse turn counter", "Observer"); return -1 }
            }
            return 0
        })()

        // Handle special transitions
        if (oldPhase == "lobby" && newPhase != "start")   { this.roundStart(); }
        if (oldPhase == "start" && newPhase == "lobby")   { this.enterLobby(); return; }
        if (oldPhase != "start" && newPhase == "lobby")   { this.roundEnd(oldPhase); return; }  // TODO IIRC there was at least one module that relied on backToLobby being called on first enter. Check it
        if (                       newPhase == "waiting") { this.waiting(); return; } 
        // if (oldPhase == "start" && newPhase != "lobby") { Observer.reconnect(); return; }

        this.controller.mutation(oldPhase, newPhase)
    }
    enterLobby() {
        this.attachNextObserver()
    }
    roundStart() {
        globalGame.roundStart()
        this.controller.roundStart()
    }
    roundEnd(oldPhase: Phase) {
        this.attachNextObserver()

        this.controller.roundEnd(oldPhase) 
    }

    attachNextObserver() {
        const observeTarget = document.querySelector("#__next")
        if (!observeTarget) { Console.alert("Could not find id:__next to observe", "Observer"); }
        else { this.nextObserver.observe(observeTarget, configChildTrunk); }
    }
    waiting() { Console.log("Waiting", "Observer") } // [C4]
    // reconnect() {
        
    // },

    nextObserver: MutationObserver = new MutationObserver((records) => {     
        // todo: add a button to manually reattach the lobby observer in popup, if I try to disconnect the observer early.

        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        this.deduceSettingsFromDocument()
        
        // console.log('next fired')
    })
    contentObserver: MutationObserver = new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        // Observer.nextObserver.disconnect()
        const newPhaseElement = this.content?.firstChild?.firstChild
        if (!newPhaseElement) { Console.alert("Cannot find element to read game phase from", "Observer"); return }

        const newPhaseString = (newPhaseElement as Element).classList.item(1)
        if (!newPhaseString) { Console.alert("Cannot read game phase from selected element"); return }

        this.mutation(newPhaseString as Phase)

        // console.log('content fired')
    })
    observe(selector: string) {
        var frame = document.querySelector(selector);
        if (!frame) {
            setTimeout(this.observe, 500, selector);
            Console.log(`Waiting for target node: ${selector}`, 'Observer')
            return
        }

        this.contentObserver.observe(frame, configChildTrunk);
        Console.log("Successfully attached observer", 'Observer');
        this.content = frame;
    }


    // TODO create DataExtractor interface?

    // Due to possible instability, I have judged that "perfect" settings tracking is infeasible.
    // Thus, the below two functions will primarily find use under Timer/Spotlight (precise reconnect), Scry (functionality), and Socket (stroke erasure).
    deduceSettingsFromXHR(data: GarticXHRData) {
        const avatarElement = document.querySelector('.avatar > i')?.previousSibling
        const userAvatar = avatarElement ? getComputedStyle(avatarElement as Element).backgroundImage : ""
        // Console.log(data, 'Observer')

        // if (data.turnMax > 0) {
            // todo: in theory we should pass these through to all the modules, but ehh.
            // game.turns = data.turnMax
            // Timer.interpolate(data.turnNum)
        //     Socket.post('setStrokeStack', data.draw)
        // }
        // Controller.updateLobbySettings(1, data)
        // Controller.updateLobbySettings(data[0], data[1])

        // const configs = data.configs
        // Controller.updateLobbySettings({
        //     "custom": [Converter.speedIndexToString(configs.speed), Converter.flowIndexToString(configs.first), Converter.turnsIndexToString(configs.turns)],
        //     "self": data.user,
        //     "usersIn": data.users
        // })
        globalGame.host = data.users.find((x: { owner?:boolean }) => x.owner === true)!.nick
        globalGame.user = data.user
        globalGame.user.avatar = userAvatar
        globalGame.players = data.users
        globalGame.turnsString = Converter.turnsIndexToString(data.configs.turns)
        globalGame.flowString = Converter.flowIndexToString(data.configs.first)
        globalGame.speedString = Converter.speedIndexToString(data.configs.speed)
        // turnsString: 'ALL',
    }
    deduceSettingsFromSocket(data: any) {
        console.log(data)
        // Controller.updateLobbySettings(data[1], data[2])
        // if (data[1] == 5) {
            // game.turns = data[2]  // it's not that easy...
        //     game.turns = Converter.turnsStringToFunction(/* TODO TODO TODO */)(data[2])
        // }
        // if (data[1] == 1) {
        // var dict = {}
        // switch (data[1]) {
        //     // case 2: 
        //     //     game.players.push(data[2])
        //     //     // dict["usersIn"] = [data[2]]; 
        //     //     break;
        //     // case 3: 
        //     //     // game.players.push(data[2])
        //     //     // dict["userOut"] = data[2]; 
        //     //     break;
        //     case 18:
        //         for (const key in data[2]) {
        //             if (key == 'speed') {
        //                 globalGame.speedString = Converter.speedIndexToString(data[2][key])
        //             }
        //             if (key == 'first') {
        //                 globalGame.flowString = Converter.flowIndexToString(data[2][key])
        //             }
        //             if (key == 'turns') {
        //                 globalGame.turnsString = Converter.turnsIndexToString(data[2][key])
        //             }
        //         }
        //         break;
        //     // case 26:
        //     //     break;
        //     case 27:
        //         globalGame.flowString = 'WRITING, DRAWING'
        //         globalGame.speedString = 'NORMAL'
        //         globalGame.turnsString = 'ALL'
        //         break;
        //     default:
        //         break;
        // }
        // Controller.updateLobbySettings(dict)
        // }
    }
    deduceSettingsFromDocument() {

        // console.log("deduce")
        const playerCounter = document.querySelector(".left")?.firstChild
        if (!playerCounter) { 
            Console.alert("Could not find player counter", "Observer"); 
            globalGame.players = new Array(16)
        } else {  // THe below line shouldn't have a ! because the above selector doesn't read confidently
            const players = Number(playerCounter.textContent!.slice(7, -3)) // : document.querySelector(".step").textContent.slice(2))
            globalGame.players = new Array(players)
        }

        globalGame.players = []
        const playerList = document.querySelector(".players .scrollElements")
        if (playerList) { 
            for (const playerElem of playerList.children) {
                if (!(playerElem instanceof HTMLElement)) { continue }
                console.log(playerElem)
                const player = Converter.tryToUser(playerElem)
                if (!player) { continue }
                console.log(player)

                globalGame.players.push(player)
                if (player.owner) {
                    globalGame.host = player.nick
                }
                if (playerElem.getElementsByTagName("i").length > 0) {
                    globalGame.user = player
                }
            }
            globalGame.players
        } else {
            Console.alert("Could not find player list", "Observer")
        }

        // if in lobby, check for the apperance of the start of round countdown and when it appears, update the current gamemode variable.
        const defaultMode = document.querySelector(".checked")?.querySelector("h4")?.textContent;
        if (defaultMode) { 
            const gameConfig = Converter.modeStringToParameters(defaultMode)
            globalGame.turnsString = gameConfig.turns
            globalGame.speedString = gameConfig.speed
            globalGame.flowString = gameConfig.flow
            return
        } 

        const gameEncodedConfig = document.querySelector(".config")?.querySelectorAll(".select");
        if (gameEncodedConfig) { 
        // if the current gamemode variable is not found by searching for .checked, then each piece must be assigned separately.
            const gameConfig = new Array(3);
            if (!gameEncodedConfig) {}
            // console.log(gameEncodedConfig);
            [0,1,2].forEach((num) => { 
                const dropdown = gameEncodedConfig[num].querySelector("select"); 
                if (dropdown) {
                    gameConfig[num] = dropdown.childNodes[dropdown.selectedIndex].textContent;    
                } else { 
                    gameConfig[num] = gameEncodedConfig[num].childNodes[0].textContent;    
                }
            })
            // Controller.updateLobbySettings({"custom": gameConfig/*, "players": players*/})

            globalGame.turnsString = gameConfig[2]
            globalGame.speedString = gameConfig[0]
            globalGame.flowString = gameConfig[1]
        }
        // game.turns = Converter.turnsStringToFunction(gameConfig[2])(players) 
        // Object.assign(game, Converter.speedStringToParameters(gameConfig[0]))
        // game.fallback = Converter.flowStringToFallback(gameConfig[1])
    }
}

function main() {
    // const auxmodules: AuxChamber = [Keybinder]
    const modules: ModuleChamber = [Timer, Koss, Refdrop, Spotlight, Geom]
    const metamodules: MetaChamber = [Red, Debug]

    const controller = new Controller(modules, metamodules)
    const observer = new Observer(controller)
    observer.observe("#content")

    // document.querySelector(".side").remove() // lol
    var side = document.querySelector(".side") as HTMLElement
    if (side) { side.style.display = "none" }
}

document.readyState === 'complete' ? main() : window.addEventListener('load', () => main());

// window.addEventListener('beforeunload', () => {
    // get states (including transient states) of all modules + 
    // shelve them

    // on load:
    // retrieve states
    // pass transience i.e. if backToLobby-ness along with aggregated state data to modules
    // so they can pick out their data


    // OR load:
    // tell all modules to retrieve states
    // on first transition:
    // if transient i.e. if not backToLobby, tell all modules to retrieve transient states
// })
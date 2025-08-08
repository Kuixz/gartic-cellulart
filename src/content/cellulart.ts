// const dogSrc: string = 'https://media.tenor.com/fej4_qoxdHYAAAAM/cute-puppy.gif'
import { 
    Phase, Console, Converter, GarticXHRData, 
    Keybinder, Keybind, SHAuth,
    Socket, Xhr,
    // IAuth, SHAuth as SHAuth, 
    IShelf, Shelf,
    setAttributes, setParent, configChildTrunk, globalGame,
    GarticUser,
    modeParameterDefaults,
    EMessagePurpose, TransitionData
} from "./foundation"
import { Timer, Koss, Refdrop, Spotlight, Geom, Scry } from "./modules"
import { Red, Debug } from "./metamodules"
import { 
    ModuleLike, CellulartModule, Metamodule,
    ModuleChamber, MetaChamber
} from "./modules/CellulartModule"
import { createButton, createModuleButton } from "./components"

class Controller { 
    // static name: Controller
    menu: HTMLElement | undefined // [C1]
    liveModules: CellulartModule[] = []
    liveMetamodules: Metamodule[] = []
    // modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    auth: SHAuth /*IAuth*/ // = new SHAuth(new Shelf())

    constructor(
        modules: ModuleChamber, 
        metamodules: MetaChamber,
    ) {
        Socket.init()
        Xhr.init()
        Keybinder.init()

        this.auth = new SHAuth(new Shelf())
        this.initPopupAuth()

        this.createMenu(modules, metamodules)
    }
    enterLobby() {
        this.liveModules.forEach(mod => mod.enterLobby())
    }
    roundStart() {
        this.liveModules.forEach(mod => mod.roundStart())
    }
    mutation(oldPhase: Phase, transitionData: TransitionData | null, newPhase: Phase) {
        this.liveModules.forEach(mod => mod.mutation(oldPhase, transitionData, newPhase))
    }
    patchReconnect(data: GarticXHRData) {
        this.liveModules.forEach(mod => mod.patchReconnect(data))
    }
    roundEnd(oldPhase: Phase) {
        Socket.roundEnd()
        this.liveModules.forEach(mod => mod.roundEnd(oldPhase))
    }
    exitLobby(oldPhase: Phase) {
        this.liveModules.forEach(mod => mod.exitLobby(oldPhase))
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

        const green = !(await this.auth.tryLogin())
        const menu = createMenuElement()
        const menuItems = menu.firstElementChild!.firstElementChild as HTMLDivElement

        menu.insertAdjacentElement("afterbegin", createButton(
            "controller",
            () => {
                // menuShown = !menuShown
                menuItems.classList.toggle("collapsed")
                return undefined
            },
        ))
        modules.forEach((modTemplate: typeof CellulartModule) => { 
            const mod = new (modTemplate as new() => CellulartModule)()
            this.liveModules.push(mod)

            const newButton = createModuleButton(mod)
            if (mod.isCheat && green) {
                hiddenButtons.push(newButton); 
                newButton.style.display = "none"
            }
            menuItems.appendChild(newButton)
            if (mod.keybinds) { Keybinder.add(mod.keybinds) }
        })
        metamodules.forEach((modTemplate: typeof Metamodule) => { 
            const mod = new (modTemplate as new(modules: CellulartModule[]) => Metamodule)(this.liveModules)
            this.liveMetamodules.push(mod)

            const newButton = createModuleButton(mod)
            if (mod.isCheat && green) {
                hiddenButtons.push(newButton); 
                newButton.style.display = "none"
            }
            menuItems.appendChild(newButton)
            // if (mod.keybinds) { Keybinder.add(mod.keybinds) }
        })

        this.menu = menuItems
        if (green) { this.unhide = unhide }

        function createMenuElement () {
            const menu = document.createElement("div")
            setAttributes(menu, { id: "controller-menu" })
            menu.innerHTML = `
            <div id="controller-cutoff">
                <div id="controller-scroll-box"></div>
            </div>
            `
            setParent(menu, document.body)
            return menu
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
    onEntryXHR: GarticXHRData | undefined
    transitionData: TransitionData | null = null;
    
    constructor(controller: Controller) {
        this.controller = controller;
        Socket.addMessageListener('socketIncoming', this.deduceSettingsFromSocket.bind(this))
        Xhr.addMessageListener('lobbySettings', this.deduceSettingsFromXHR.bind(this))
    }
    executePhaseTransition(newPhase: Phase): void {
        // Set variables
        const oldPhase = globalGame.currentPhase
        globalGame.currentPhase = newPhase
        Console.log(`Transitioned to ${newPhase}`, "Observer")

        globalGame.currentTurn = (() => {
            if (["first", "draw", "write", "memory", "mod"].includes(newPhase)) {
                const step = document.querySelector(".step")
                if (!step) { Console.warn("Could not find turn counter", "Observer"); return -1 }
                if (!(step.textContent)) { Console.warn("Could not read turn counter", "Observer"); return -1 }

                const slashIndex = step.textContent.indexOf("/")
                const turnCount = Number(step.textContent.slice(0, slashIndex))
                if (isNaN(turnCount)) { Console.warn("Could not parse turn counter", "Observer"); return -1 }
                return turnCount
            } else {
                return 0
            }
        })()

        const outOfGame = (phase: Phase) => phase == "start" || phase == "lobby"

        // Handle transitions
        if (oldPhase == "start")                         { this.enterLobby() }
        if (outOfGame(oldPhase) && !outOfGame(newPhase)) { this.roundStart(); }

        if (!outOfGame(newPhase))                        { this.mutation(oldPhase, this.transitionData, newPhase) }
        if (oldPhase == "start" && !outOfGame(newPhase))  { this.patchReconnect(); } // Bypassing lobby phase means a reconnection.
        
        // TODO IIRC there was at least one module that relied on backToLobby being called on first enter. Check it
        if (!outOfGame(oldPhase) && outOfGame(newPhase))  { this.roundEnd(oldPhase); }  
        if (newPhase == "start")                         { this.exitLobby(oldPhase); } 

        if (newPhase == "waiting")                       { this.waiting(); } 

        this.transitionData = null;
    }
    enterLobby() {
        this.attachNextObserver()

        this.controller.enterLobby() 
    }
    roundStart() {
        globalGame.roundStart()
        this.controller.roundStart()
    }
    patchReconnect() {
        if (this.onEntryXHR === undefined) { 
            Console.warn("Trying to patch data for reconnection but no XHR data found")
            return 
        }
        // Expected to patch Socket stroke data here as well
        this.controller.patchReconnect(this.onEntryXHR)
        delete this.onEntryXHR
    }
    mutation(oldPhase: Phase, transitionData: TransitionData | null, newPhase: Phase) {
        this.controller.mutation(oldPhase, transitionData, newPhase)
    }
    roundEnd(oldPhase: Phase) {
        this.attachNextObserver()

        this.controller.roundEnd(oldPhase) 
    }
    exitLobby(oldPhase: Phase) {
        globalGame.players = []

        this.controller.exitLobby(oldPhase) 
    }

    attachNextObserver() {
        const observeTarget = document.querySelector("#__next")
        if (!observeTarget) { Console.warn("Could not find id:__next to observe", "Observer"); }
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
    })
    contentObserver: MutationObserver = new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        // Observer.nextObserver.disconnect()
        const newPhaseElement = this.content?.firstChild?.firstChild
        if (!newPhaseElement) { Console.warn("Cannot find element to read game phase from", "Observer"); return }

        const newPhaseString = (newPhaseElement as Element).classList.item(1)
        if (!newPhaseString) { Console.warn("Cannot read game phase from selected element"); return }

        this.executePhaseTransition(newPhaseString as Phase)

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

    // Due to possible instability, "perfect" settings tracking should be infeasible.
    // Practically, though, supposing that Gartic doesn't often rearrange their enums, I won't have to either.
    deduceSettingsFromXHR(data: GarticXHRData) {
        Console.log(`Deducing from XHR ${JSON.stringify(data)}`, "Observer")

        globalGame.host = data.users.find((x: GarticUser) => x.owner === true)!.nick
        globalGame.user = data.user
        globalGame.user.avatar = "https://garticphone.com/images/avatar/" + data.user.avatar + ".svg"

        globalGame.players = data.users
        for (const player of globalGame.players) {
            player.avatar = "https://garticphone.com/images/avatar/" + player.avatar + ".svg"
        }
        globalGame.turnsIndex = data.configs.turns
        globalGame.flowIndex = data.configs.first
        globalGame.speedIndex = data.configs.speed
        globalGame.keepIndex = data.configs.keep

        if (data.screen != 1) {  // Bad solution to this two-systems thing we have going on. 
            this.onEntryXHR = data
        }
    }
    deduceSettingsFromSocket(data: [2, EMessagePurpose, any]) {  
        const [ _, messageType, messageData ] = data

        switch (messageType) {
            case EMessagePurpose.USER_JOIN: {  // New user joins
                const newUser = messageData as GarticUser
                newUser.avatar = "https://garticphone.com/images/avatar/" + newUser.avatar + ".svg"
                globalGame.players.push(newUser)
                break;
            }
            case EMessagePurpose.USER_LEAVE: {  // Existing user leaves
                const index = globalGame.players.findIndex((user) => user.id === messageData.userLeft)
                if (index == -1) {
                    Console.warn(`Could not remove user: no user with id ${messageData.userLeft} found`, "Observer")
                    break
                }
                globalGame.players.splice(index, 1)
                break;
            }
            case EMessagePurpose.TURN_TRANSITION: {
                // While I'd love to call executePhaseTransition here and remove the observer entirely,
                // the unique memory phase doesn't emit a socket signal when exiting it,
                // and is indistinguishable from a regular draw phase when entering.
                // this.executePhaseTransition(messageData)

                // Instead we abuse the fact that we catch and interpret Socket messages
                // before they get to the Gartic client.
                // This is bad, dumb code.
                this.patchTransitionData(messageData)
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_CUSTOM: {  // Custom settings changed
                for (const key in messageData) {
                    switch (key) {
                        case 'turns': 
                            globalGame.turnsIndex = messageData[key]
                            break
                        case 'speed': 
                            globalGame.speedIndex = messageData[key]
                            break
                        case 'flow': 
                            globalGame.flowIndex = messageData[key]
                            break
                        case 'keep': 
                            globalGame.keepIndex = messageData[key]
                            break
                    }
                }
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_PRESET: {  // Default settings changed
                const modeParameters = Converter.modeIndexToParameters(messageData)
                globalGame.turnsIndex = modeParameters.turns
                globalGame.speedIndex = modeParameters.speed
                globalGame.flowIndex = modeParameters.flow
                globalGame.keepIndex = modeParameters.keep
                break;
            }
            case EMessagePurpose.APPLY_SETTINGS_PRESET: {  // Return to normal settings when changing tabs
                const modeParameters = modeParameterDefaults
                globalGame.turnsIndex = modeParameters.turns
                globalGame.speedIndex = modeParameters.speed
                globalGame.flowIndex = modeParameters.flow
                globalGame.keepIndex = modeParameters.keep
                break;
            }
        }
    }
    deduceSettingsFromDocument() {
        const playerList = document.querySelector(".players .scrollElements")
        if (playerList) { 
            for (const playerElem of playerList.children) {
                if (!(playerElem instanceof HTMLElement)) { continue }
                // console.log(playerElem)
                const player = Converter.tryToUser(playerElem)
                if (!player) { continue }
                // console.log(player)

                // Do not overwrite XHR players wherever possible
                const existingPlayer = globalGame.players.find((user) => user.nick === player.nick)
                if (existingPlayer) { 
                    existingPlayer.avatar = player.avatar
                    continue
                }

                globalGame.players.push(player)
                if (player.owner) {
                    globalGame.host = player.nick
                }
                if (playerElem.getElementsByTagName("i").length > 0) {
                    globalGame.user = player
                }
            }
        }
    }
    patchTransitionData(data: any) {
        this.transitionData = data
    }
}

function main() {
    const modules: ModuleChamber = [Timer, Koss, Refdrop, Spotlight, Geom, Scry]
    const metamodules: MetaChamber = [Red, Debug]

    const controller = new Controller(modules, metamodules)
    const observer = new Observer(controller)
    observer.observe("#content")

    // document.querySelector(".side").remove() // lol
    var side = document.querySelector(".side") as HTMLElement
    if (side) { side.style.display = "none" }
}

document.readyState === 'complete' ? main() : window.addEventListener('load', () => main());

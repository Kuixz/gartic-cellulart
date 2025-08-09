// const dogSrc: string = 'https://media.tenor.com/fej4_qoxdHYAAAAM/cute-puppy.gif'
import { 
    Phase, Console, Converter, GarticXHRData, 
    Keybinder, Keybind, SHAuth,
    Socket, Xhr,
    // IAuth, SHAuth as SHAuth, 
    IShelf, Shelf,
    setAttributes, setParent, configChildTrunk,
    GarticUser,
    modeParameterDefaults,
    EMessagePurpose, TransitionData,
    BaseGame,
    AlbumChangeData,
    CellulartEventType
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
    game: BaseGame
    menu: HTMLElement | undefined // [C1]
    liveModules: CellulartModule[] = []
    liveMetamodules: Metamodule[] = []
    // modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    auth: SHAuth /*IAuth*/ // = new SHAuth(new Shelf())

    constructor(
        game: BaseGame,
        modules: ModuleChamber, 
        metamodules: MetaChamber,
    ) {
        this.game = game;

        Socket.init()
        Xhr.init()
        Keybinder.init()

        this.auth = new SHAuth(new Shelf())
        this.initPopupAuth()

        this.createMenu(modules, metamodules)
    }
    enterLobby() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ENTER_LOBBY))
    }
    roundStart() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ENTER_ROUND))
    }
    mutation(oldPhase: Phase, data: TransitionData | null, newPhase: Phase) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.PHASE_CHANGE, { 
            detail: { oldPhase, data, newPhase } 
        }))
    }
    patchReconnect(data: GarticXHRData) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.RECONNECT, { detail: data }))
    }
    albumChange(data: AlbumChangeData) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ALBUM_CHANGE, { detail: data }))
    }
    roundEnd() {
        Socket.roundEnd()
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.LEAVE_ROUND))
    }
    exitLobby() {
        Socket.exitLobby()
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.LEAVE_LOBBY))
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
            const mod = new (modTemplate as new(globalGame: BaseGame) => CellulartModule)(this.game)
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
    game: BaseGame
    content: Element | undefined
    targetBook : Element | null = null
    controller: Controller
    onEntryXHR: GarticXHRData | undefined
    transitionData: TransitionData | null = null;
    
    constructor(game: BaseGame, controller: Controller) {
        this.game = game
        this.controller = controller;
        Socket.addMessageListener('socketIncoming', this.deduceSettingsFromSocket.bind(this))
        Xhr.addMessageListener('lobbySettings', this.deduceSettingsFromXHR.bind(this))
    }
    executePhaseTransition(newPhase: Phase): void {
        // Set variables
        const oldPhase = this.game.currentPhase
        this.game.currentPhase = newPhase
        Console.log(`Transitioned to ${newPhase}`, "Observer")

        this.game.currentTurn = (() => {
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
        if (!outOfGame(oldPhase) && outOfGame(newPhase))  { this.roundEnd(); }  
        if (newPhase == "start")                         { this.exitLobby(); } 

        if (newPhase == "waiting")                       { this.waiting(); } 

        this.transitionData = null;
    }
    enterLobby() {
        this.controller.enterLobby() 
    }
    roundStart() {
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
    roundEnd() {
        this.targetBook = null
        this.controller.roundEnd() 
    }
    exitLobby() {
        this.controller.exitLobby() 
    }

    waiting() { Console.log("Waiting", "Observer") } // [C4]

    contentObserver: MutationObserver = new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }
        // Observer.nextObserver.disconnect()
        const newPhaseElement = this.content?.firstChild?.firstChild
        if (!newPhaseElement) { Console.warn("Cannot find element to read game phase from", "Observer"); return }

        const newPhase = (newPhaseElement as Element).classList.item(1) as Phase
        if (!newPhase) { Console.warn("Cannot read game phase from selected element"); return }

        this.executePhaseTransition(newPhase)
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

        this.game.host = data.users.find((x: GarticUser) => x.owner === true)!.nick
        this.game.user = data.user
        this.game.user.avatar = "https://garticphone.com/images/avatar/" + data.user.avatar + ".svg"

        this.game.players = data.users
        for (const player of this.game.players) {
            player.avatar = "https://garticphone.com/images/avatar/" + player.avatar + ".svg"
        }
        this.game.turnsIndex = data.configs.turns
        this.game.flowIndex = data.configs.first
        this.game.speedIndex = data.configs.speed
        this.game.keepIndex = data.configs.keep

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
                this.game.players.push(newUser)
                break;
            }
            case EMessagePurpose.USER_LEAVE: {  // Existing user leaves
                const index = this.game.players.findIndex((user) => user.id === messageData.userLeft)
                if (index == -1) {
                    Console.warn(`Could not remove user: no user with id ${messageData.userLeft} found`, "Observer")
                    break
                }
                this.game.players.splice(index, 1)
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
                            this.game.turnsIndex = messageData[key]
                            break
                        case 'speed': 
                            this.game.speedIndex = messageData[key]
                            break
                        case 'flow': 
                            this.game.flowIndex = messageData[key]
                            break
                        case 'keep': 
                            this.game.keepIndex = messageData[key]
                            break
                    }
                }
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_PRESET: {  // Default settings changed
                const modeParameters = Converter.modeIndexToParameters(messageData)
                this.game.turnsIndex = modeParameters.turns
                this.game.speedIndex = modeParameters.speed
                this.game.flowIndex = modeParameters.flow
                this.game.keepIndex = modeParameters.keep
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_DEFAULT: {  // Return to normal settings when changing tabs
                const modeParameters = modeParameterDefaults
                this.game.turnsIndex = modeParameters.turns
                this.game.speedIndex = modeParameters.speed
                this.game.flowIndex = modeParameters.flow
                this.game.keepIndex = modeParameters.keep
                break;
            }
        }
    }
    patchTransitionData(data: any) {
        this.transitionData = data
    }
}

function main() {
    const modules = [Timer, Koss, Refdrop, Spotlight, Geom, Scry]
    const metamodules = [Red, Debug]

    const game = new BaseGame()
    const controller = new Controller(game, modules, metamodules)
    const observer = new Observer(game, controller)
    observer.observe("#content")

    // document.querySelector(".side").remove() // lol
    var side = document.querySelector(".side") as HTMLElement
    if (side) { side.style.display = "none" }
}

document.readyState === 'complete' ? main() : window.addEventListener('load', () => main());

// const dogSrc: string = 'https://media.tenor.com/fej4_qoxdHYAAAAM/cute-puppy.gif'
import { 
    Phase, Console, Converter, GarticXHRData, 
    Keybinder, SHAuth,
    Socket, Xhr,
    // IAuth, SHAuth as SHAuth, 
    Shelf,
    setAttributes, setParent, configChildTrunk,
    GarticUser,
    modeParameterDefaults,
    EMessagePurpose, TransitionData,
    BaseGame,
    AlbumChangeData,
    CellulartEventType,
    StrokeSender
} from "./foundation"
import { Timer, Koss, Refdrop, Spotlight, Geom, Scry, Akasha } from "./modules"
import { Red, Debug } from "./metamodules"
import { 
    ModuleArgs, CellulartModule, Metamodule,
    ModuleChamber, MetaChamber
} from "./modules/CellulartModule"
import { createButton, createModuleButton } from "./components"

const outOfGame = (phase: Phase) => phase == "start" || phase == "lobby"
// const inGame = (phase: Phase) => phase == "draw" || phase == "write" || phase == "memory" || phase == "first"

class Controller { 
    // static name: Controller
    public game: BaseGame
    public socket: Socket
    public strokeSender: StrokeSender
    menu: HTMLElement | undefined // [C1]
    liveModules: CellulartModule[] = []
    liveMetamodules: Metamodule[] = []
    // modules: [Timer, Koss, Refdrop, Spotlight, Geom, Red, Debug], //, Reveal]
    auth: SHAuth /*IAuth*/ // = new SHAuth(new Shelf())

    constructor(
        modules: ModuleChamber, 
        metamodules: MetaChamber,
    ) {
        const shelf = new Shelf()
        this.game = new BaseGame();
        this.socket = new Socket(this.game);
        this.strokeSender = new StrokeSender(this.socket, this.game);
        this.auth = new SHAuth(shelf)

        Xhr.init()
        Keybinder.init()

        this.initPopupAuth()

        this.createMenu({ 
            game: this.game, 
            socket: this.socket,
            strokeSender: this.strokeSender,
            shelf: shelf,
        }, modules, metamodules)
    }
    onlobbyenter() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ENTER_LOBBY))
    }
    onroundenter() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ENTER_ROUND))
    }
    onphasechange(oldPhase: Phase, data: TransitionData | null, newPhase: Phase) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.PHASE_CHANGE, { 
            detail: { oldPhase, data, newPhase } 
        }))
    }
    onreconnect(data: GarticXHRData) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.RECONNECT, { detail: data }))
    }
    onalbumchange(data: AlbumChangeData) {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.ALBUM_CHANGE, { detail: data }))
    }
    ontimelinechange() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.TIMELINE_CHANGE))
    }
    onroundleave() {
        this.game.dispatchEvent(new CustomEvent(CellulartEventType.LEAVE_ROUND))
    }
    onlobbyleave() {
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
        moduleArgs: ModuleArgs,
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
            const mod = new (modTemplate as new(moduleArgs: ModuleArgs) => CellulartModule)(moduleArgs)
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
    targetBook : Element | null = null
    controller: Controller
    onEntryXHR: GarticXHRData | undefined
    
    constructor(controller: Controller) {
        this.controller = controller;
        this.controller.socket.addEventListener('socketIncoming', this.deduceSettingsFromSocket.bind(this))
        Xhr.addMessageListener('lobbySettings', this.deduceSettingsFromXHR.bind(this))
    }
    onlobbyenter() {
        this.controller.onlobbyenter() 
    }
    onroundenter() {
        this.controller.onroundenter()
    }
    onreconnect() {
        if (this.onEntryXHR === undefined) { 
            Console.warn("Trying to patch data for reconnection but no XHR data found")
            return 
        }
        // Expected to patch Socket stroke data here as well
        this.controller.onreconnect(this.onEntryXHR)
        delete this.onEntryXHR
    }
    onphasechange(oldPhase: Phase, transitionData: TransitionData | null, newPhase: Phase) {
        this.controller.onphasechange(oldPhase, transitionData, newPhase)
    }
    onalbumchange(element: HTMLElement, data: any) {
        this.controller.onalbumchange({ element, data })
    }
    ontimelinechange() {
        this.controller.ontimelinechange()
    }
    onroundleave() {
        this.targetBook = null
        this.controller.onroundleave() 
    }
    onlobbyleave() {
        this.controller.onlobbyleave() 
    }

    waiting() { Console.log("Waiting", "Observer") } // [C4]

    private observerTransition: [Phase, number] | null = null;
    private socketTransition: TransitionData | null = null;
    private recordObserverTransition(observerTransition: [Phase, number]) {
        this.observerTransition = observerTransition
        this.attemptPhaseTransition()
    }
    private recordSocketTransition(socketTransition: TransitionData) {
        this.socketTransition = socketTransition
        this.attemptPhaseTransition()
    }
    private attemptPhaseTransition() {
        if (
            this.observerTransition 
            && this.socketTransition
            && this.socketTransition.turnNum + 1 == this.observerTransition[1]
        ) {
            this.executePhaseTransition(this.socketTransition, this.observerTransition[0])
        }
    }
    private executePhaseTransition(transitionData: TransitionData | null, newPhase: Phase): void {
        // Set variables
        const oldPhase = this.controller.game.currentPhase
        this.controller.game.currentPhase = newPhase
        Console.log(`Transitioned to ${newPhase}`, "Observer")

        // Handle transitions
        if (oldPhase == "start")                         { this.onlobbyenter(); }
        if (outOfGame(oldPhase) && !outOfGame(newPhase)) { this.onroundenter(); }

        if (!outOfGame(newPhase))                        { this.onphasechange(oldPhase, transitionData, newPhase) }
        if (oldPhase == "start" && !outOfGame(newPhase)) { this.onreconnect(); } // Bypassing lobby phase means a reconnection.
        
        // TODO IIRC there was at least one module that relied on backToLobby being called on first enter. Check it
        if (!outOfGame(oldPhase) && outOfGame(newPhase)) { this.onroundleave(); }  
        if (newPhase == "start")                         { this.onlobbyleave(); } 

        if (newPhase == "waiting")                       { this.waiting(); } // TODO: Overlaps with reconnect?
    }
    contentObserver: MutationObserver = new MutationObserver((records) => {
        // The observer fires twice per phase change: once the fade effect starts and once when the fade effect stops. Hence:
        if(records[0].addedNodes.length <= 0) { return; }

        // Find game phase
        const newPhaseElement = this.content?.firstChild?.firstChild
        if (!newPhaseElement) { Console.warn("Cannot find element to read game phase from", "Observer"); return }
        let newPhase = (newPhaseElement as Element).classList.item(1) as Phase
        if (!newPhase) { Console.warn("Cannot read game phase from selected element", "Observer"); return }

        // Update current turn
        const currentTurn = (() => {
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
        this.controller.game.currentTurn = currentTurn

        // For some reason, Story Mode's DOM is structured so that every turn is the first
        if (currentTurn != 1 && newPhase == 'first') {
            newPhase = 'write'
        }

        // console.log(newPhase)
        if (!outOfGame(newPhase)) {
            this.recordObserverTransition([newPhase, currentTurn])
        } else {
            this.executePhaseTransition(null, newPhase)
        }
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
// TODO: the story phase uses First for every phase. fuck

    // TODO create DataExtractor interface?

    // Due to possible instability, "perfect" settings tracking should be infeasible.
    // Practically, though, supposing that Gartic doesn't often rearrange their enums, I won't have to either.
    deduceSettingsFromXHR(data: GarticXHRData) {
        Console.log(`Deducing from XHR ${JSON.stringify(data)}`, "Observer")

        this.controller.game.host = data.users.find((x: GarticUser) => x.owner === true)!.nick
        this.controller.game.user = data.user
        this.controller.game.user.avatar = "https://garticphone.com/images/avatar/" + data.user.avatar + ".svg"

        this.controller.game.players = data.users
        for (const player of this.controller.game.players) {
            player.avatar = "https://garticphone.com/images/avatar/" + player.avatar + ".svg"
        }
        this.controller.game.turnsIndex = data.configs.turns
        this.controller.game.flowIndex = data.configs.first
        this.controller.game.speedIndex = data.configs.speed
        this.controller.game.keepIndex = data.configs.keep

        if (data.screen != 1) {  // Bad solution to this two-systems thing we have going on. 
            this.onEntryXHR = data
        }
    }
    deduceSettingsFromSocket(event: Event) {  
        const { detail: [ _, messageType, messageData ] } = event as CustomEvent

        switch (messageType) {
            case EMessagePurpose.USER_JOIN: {  // New user joins
                const newUser = messageData as GarticUser
                newUser.avatar = "https://garticphone.com/images/avatar/" + newUser.avatar + ".svg"
                this.controller.game.players.push(newUser)
                break;
            }
            case EMessagePurpose.USER_LEAVE: {  // Existing user leaves
                const index = this.controller.game.players.findIndex((user) => user.id === messageData.userLeft)
                if (index == -1) {
                    Console.warn(`Could not remove user: no user with id ${messageData.userLeft} found`, "Observer")
                    break
                }
                this.controller.game.players.splice(index, 1)
                break;
            }
            case EMessagePurpose.TURN_TRANSITION: {
                // While I'd love to call executePhaseTransition here and remove the observer entirely,
                // the unique memory phase doesn't emit a socket signal when exiting it,
                // and is indistinguishable from a regular draw phase when entering.
                // this.executePhaseTransition(messageData)

                // This is bad, dumb code.
                this.recordSocketTransition(messageData)
                break;
            }
            case EMessagePurpose.GALLERY_SHOW_TURN: {
                if ((messageData.data === undefined) && (messageData.user !== undefined)) { return }
                this.onalbumchange(this.getMostRecentExhibit(), messageData.data)
                break;
            }
            case EMessagePurpose.GALLERY_CHANGE_TIMELINE: {
                this.ontimelinechange()
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_CUSTOM: {  // Custom settings changed
                for (const key in messageData) {
                    switch (key) {
                        case 'turns': 
                            this.controller.game.turnsIndex = messageData[key]
                            break
                        case 'speed': 
                            this.controller.game.speedIndex = messageData[key]
                            break
                        case 'flow': 
                            this.controller.game.flowIndex = messageData[key]
                            break
                        case 'keep': 
                            this.controller.game.keepIndex = messageData[key]
                            break
                    }
                }
                break;
            }
            // case EMessagePurpose.GALLERY_END: {
            //     this.executePhaseTransition(null, 'lobby')
            //     break;
            // }
            case EMessagePurpose.ROUND_END: {
                this.executePhaseTransition(null, 'book')
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_PRESET: {  // Default settings changed
                const modeParameters = Converter.modeIndexToParameters(messageData)
                this.controller.game.turnsIndex = modeParameters.turns
                this.controller.game.speedIndex = modeParameters.speed
                this.controller.game.flowIndex = modeParameters.flow
                this.controller.game.keepIndex = modeParameters.keep
                break;
            }
            case EMessagePurpose.CHANGE_SETTINGS_DEFAULT: {  // Return to normal settings when changing tabs
                const modeParameters = modeParameterDefaults
                this.controller.game.turnsIndex = modeParameters.turns
                this.controller.game.speedIndex = modeParameters.speed
                this.controller.game.flowIndex = modeParameters.flow
                this.controller.game.keepIndex = modeParameters.keep
                break;
            }
            // case EMessagePurpose.AWAIT_MODERATION: {
            //     this.recordSocketTransition 
            //     break;
            // }
        }
    }

    private getMostRecentExhibit(): HTMLElement {
        if (this.targetBook === null) {
            this.targetBook = document.querySelector('.timeline .scrollElements')
        }

        const children = this.targetBook!.children
        return children[children.length - 1] as HTMLElement
    }
}

function main() {
    const modules = [Timer, Koss, Refdrop, Spotlight, Geom, Scry, Akasha]
    const metamodules = [Red, Debug]

    const controller = new Controller(modules, metamodules)
    const observer = new Observer(controller)
    observer.observe("#content")

    // document.querySelector(".side").remove() // lol
    var side = document.querySelector(".side") as HTMLElement
    if (side) { side.style.display = "none" }
}

document.readyState === 'complete' ? main() : window.addEventListener('load', () => main());



const Keybinder = {
    keybinds: undefined,   // [Keybind]
    init() {
        document.addEventListener("keydown", (e) => {  // console.log(e.code)
            Keybinder.keybinds.forEach((bind) => bind.triggeredBy(e) && bind.response(e))
        })
        Keybinder.reset()
    },
    reset() {
        Keybinder.keybinds = []
    },
    set(keybinds) {
        Keybinder.keybinds = keybinds
    },
    add(keybinds) {
        Keybinder.keybinds = Keybinder.keybinds.concat(keybinds)
    }
}

class Keybind {
    // triggeredBy   // Event => Bool
    // response      // Event => Any
    constructor(triggeredBy, response) {
        this.triggeredBy = triggeredBy;
        this.response = response;
    }
}

export { Keybinder, Keybind }
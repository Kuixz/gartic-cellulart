class Keybind {
    triggeredBy: (e: Event) => boolean
    response: (e: Event) => any
    
    constructor(triggeredBy: (e: Event) => boolean, response: (e: Event) => any) {
        this.triggeredBy = triggeredBy;
        this.response = response;
    }
}

class Keybinder {
    keybinds: Keybind[]

    constructor(keybinds: Keybind[]) {
        this.keybinds = keybinds

        document.addEventListener("keydown", (e) => {  // console.log(e.code)
            keybinds.forEach((bind) => bind.triggeredBy(e) && bind.response(e))
        })

        this.reset()
    }
    reset() {
        this.keybinds = []
    }
    set(keybinds: Keybind[]) {
        this.keybinds = keybinds
    }
    add(keybinds: Keybind[]) {
        this.keybinds = this.keybinds.concat(keybinds)
    }
}

export { Keybinder, Keybind }
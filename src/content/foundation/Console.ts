class Console { // Only print certain messages
    name: string = "Console"
    // enabled: new Set(),
    enabled: Set<string> = new Set(['Console', 'Spotlight', 'Xhr'])

    toggle(modName: string) {
        this.set(modName, !this.enabled.has(modName))
    }
    set(modName: string, enabled: boolean) {
        enabled ? this.enabled.add(modName) : this.enabled.delete(modName)
        this.log((enabled ? "Enabled " : "Disabled ") + "logging for " + modName, 'Console')
    }
    log(message: string, modName?: string) {
        if (modName !== undefined && !this.enabled.has(modName)) { return }
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.log(msg)
    }
    alert(message: string, modName?: string) {
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.warn(msg)
    }
    onprint(message: string) {} // Dynamically set
}

const ConsoleInstance = new Console()

export { ConsoleInstance as Console }
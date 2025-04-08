class Console { // Only print certain messages
    name: string = "Console"
    // enabled: new Set(),
    shouldLog: boolean = true
    enabledLoggingFor: Set<string|undefined> = new Set(['Console', undefined, 'Spotlight', 'Socket', 'Xhr'])

    toggle(modName: string) {
        this.set(modName, !this.enabledLoggingFor.has(modName))
    }
    set(modName: string, enabled: boolean) {
        enabled ? this.enabledLoggingFor.add(modName) : this.enabledLoggingFor.delete(modName)
        this.log((enabled ? "Enabled " : "Disabled ") + "logging for " + modName, 'Console')
    }
    log(message: string, modName?: string) {
        if (!this.shouldLog || !this.enabledLoggingFor.has(modName)) { return }
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.log(msg)
    }
    warn(message: string, modName?: string) {
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.warn(msg)
    }
    onprint(message: string) {} // Dynamically set
}

const ConsoleInstance = new Console()

export { ConsoleInstance as Console }

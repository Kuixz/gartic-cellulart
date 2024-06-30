

const Console = { // Only print certain messages
    name: "Console",
    // enabled: new Set(),
    enabled: new Set([/*'Observer',*//*'Socket', */'Spotlight', 'Xhr', 'Console']),

    toggle: function(mod) {
        this.set(mod, !this.enabled.has(mod))
    },
    set: function(mod, enabled) {
        enabled ? this.enabled.add(mod) : this.enabled.delete(mod)
        Console.log((enabled ? "Enabled " : "Disabled ") + "logging for " + mod, 'Console')
    },
    log: function(message, mod=null) {
        const modName = mod || mod.name || null
        if (modName && !this.enabled.has(modName)) { return }
        // if (mod.name && !this.enabled.has(mod.name)) { return }
        const msg = `[${modName}] ${message}`
        this.onprint(msg)
        console.log(msg)
    },
    alert: function(message, mod) {
        const msg = `[${mod}] ERROR: ${message}`
        this.onprint(msg)
        console.log(msg)
    },
    onprint: function(message) {}, // Dynamically set
};

export default Console
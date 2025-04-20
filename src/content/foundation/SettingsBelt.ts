import { getMenuIcon } from "./Util"

class Setting {
    internalName: string
    overrideAssetPath: string | undefined

    constructor(name: string, overrideAsset?: string) {
        this.internalName = name
        this.overrideAssetPath = overrideAsset
    }
}

class SettingsBelt {
    items: Setting[] // derived from Circulator, derived from Iterator, trimmed
    length: number
    index: number
    extension: Setting | undefined

    constructor(array: Setting[], defaultIndex?: number, extension?: Setting) {
        this.items = array
        this.length = array.length
        this.index = defaultIndex || 0
        this.extension = extension
    }

    // this.items[this.index] will only be undefined after retracting while set to the extension.
    get current() { return (this.items[this.index] || this.extension) }
    isSetTo(internalName: string): boolean { return this.current.internalName == internalName }
    next() { 
        if (this.index >= this.length) {
            this.index = 0
        } else {
            this.index = (this.index + 1) % this.length; 
        }
        return this.current
    }
    prev() {  // Unused
        if (this.index >= this.length) {
            this.index = this.length - 1
        } else {
            this.index = (this.index + this.length - 1) % this.length; 
        }
        return this.current
    }

    extend() {
        if (!this.extension) { return } 
        this.length += 1; 
        this.items.push(this.extension) 
    }
    retract() {
        if (!this.extension) { return } 
        this.length -= 1
        this.items.pop()
    }
    jump(settingName: string) {
        while (this.current.internalName != settingName) { this.next() }
    }
}

const DefaultSettings = {
    on: "on",
    off: "off",
    red: "red"
}
const DefaultSettingsValues = Object.values(DefaultSettings)

function SettingFrom(settingName: string, overrideAsset?: string): Setting {
    return new Setting(settingName, overrideAsset ? getMenuIcon(`${overrideAsset}.png`) : undefined)
}

function SettingsBeltFrom(moduleName: string, settingNames: string[], defaultIndex: number, extension?: string): SettingsBelt {
    return new SettingsBelt(
        settingNames.map((s) => SettingFrom(s, s in DefaultSettingsValues ? undefined : `${moduleName}-${s}`)),
        defaultIndex,
        extension ? SettingFrom(extension) : undefined
    )
}

/** State order: Off, On */ 
function WhiteSettingsBelt(moduleName: string, enabledByDefault: boolean = false, extension?: string): SettingsBelt { 
    return SettingsBeltFrom(moduleName, [DefaultSettings.off, DefaultSettings.on], enabledByDefault ? 1 : 0, extension)
}

/** State order: Off, On, Red */ 
function RedSettingsBelt(moduleName: string, enabledByDefault: boolean = false): SettingsBelt { 
    return WhiteSettingsBelt(moduleName, enabledByDefault, DefaultSettings.red)
}

export { Setting, SettingsBelt, SettingFrom, SettingsBeltFrom, WhiteSettingsBelt, RedSettingsBelt, DefaultSettings }

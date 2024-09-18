import { getMenuIcon } from "./Util"

class Setting {
    internalName: string
    assetPath: string

    constructor(name: string, asset: string) {
        this.internalName = name
        this.assetPath = asset
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

    get current() { return this.items[this.index] }  // TODO: change this to get syntax
    // isSetTo(thing) { return this.current == thing }
    next() { this.index = (this.index + 1              ) % this.length; return this.current}
    prev() { this.index = (this.index + this.length - 1) % this.length; return this.current} // Unused

    extend() {
        if (!this.extension) { return } 
        this.length += 1; 
        this.items.push(this.extension) 
    }
    retract() {
        if (!this.extension) { return } 
        this.length -= 1
        this.items.slice(0, this.length - 1)
        if (this.index == this.length) { this.index = this.length - 1 }
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

function SettingFrom(moduleName: string, settingName: string): Setting {
    return new Setting(settingName, getMenuIcon(`${moduleName}-${settingName}.png`))
}

function SettingsBeltFrom(moduleName: string, settingNames: string[], defaultIndex: number, extension?: string): SettingsBelt {
    return new SettingsBelt(
        settingNames.map((s) => SettingFrom(moduleName, s)),
        defaultIndex,
        extension ? SettingFrom(moduleName, extension) : undefined
    )
}

function WhiteSettingsBelt(moduleName: string, enabledByDefault: boolean = false, extension?: string): SettingsBelt { 
    return SettingsBeltFrom(moduleName, [DefaultSettings.off, DefaultSettings.on], enabledByDefault ? 1 : 0, extension)
}

function RedSettingsBelt(moduleName: string, enabledByDefault: boolean = false): SettingsBelt { 
    return WhiteSettingsBelt(moduleName, enabledByDefault, DefaultSettings.red)
}

export { Setting, SettingsBelt, SettingFrom, SettingsBeltFrom, WhiteSettingsBelt, RedSettingsBelt, DefaultSettings }
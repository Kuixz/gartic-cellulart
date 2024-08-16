class SettingsBelt {
    items: string[] // derived from Circulator, derived from Iterator, trimmed
    length: number
    index: number
    extension: string | undefined

    constructor(array: string[], defaultIndex?: number, extension?: string) {
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
    jump(setting: string) {
        while (this.current != setting) { this.next() }
    }
}
class WhiteSettingsBelt extends SettingsBelt {
    constructor(enabledByDefault: boolean = false, extension?: string) { 
        super(['off', 'on'], enabledByDefault ? 1 : 0, extension)
    }
}
class RedSettingsBelt extends WhiteSettingsBelt {
    constructor(enabledByDefault: boolean = false) { 
        super(enabledByDefault, 'red')
    }
}

export { SettingsBelt, WhiteSettingsBelt, RedSettingsBelt }
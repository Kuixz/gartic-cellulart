class Setting {
    constructor(name, asset=undefined) {
        this.name = name
        this.asset = asset
    }
}
class SettingsBelt { // derived from Circulator, derived from Iterator, trimmed
    constructor(array, defaultIndex, extension) {
        this.items = array
        this.length = array.length
        this.index = defaultIndex || 0
        this.extension = extension
    }
    get current() { return this.items[this.index] } 
    // get currentAsset() { return this.items[this.index].asset }
    // isSetTo(thing) { return this.current == thing }
    next() { this.index = (this.index + 1              ) % this.length; return this.current }
    prev() { this.index = (this.index + this.length - 1) % this.length; return this.current } // Unused

    extend() {
        if (!this.extension) { return } 
        this.length += 1; 
        this.items.push(this.extension) 
    }
    retract() {
        if (!this.extension) { return } 
        this.length -= 1
        this.items.slice(0, this.length - 1)
        if (this.index == this.length) { this.index = this.length - 1 }  // Technically can cause issues with icon desync
    }
    jump(setting) {
        while (this.current != setting) { this.next() }
    }
}
class WhiteSettingsBelt extends SettingsBelt {
    constructor(defaultState, extension) { 
        super(['off', 'on'], [1,'on',true].includes(defaultState) ? 1 : 0, extension)
    }
}
class RedSettingsBelt extends WhiteSettingsBelt {
    constructor(defaultState) { 
        super(defaultState, 'red')
    }
}

export { Setting, SettingsBelt, RedSettingsBelt, WhiteSettingsBelt }
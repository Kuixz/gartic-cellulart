

class LazyInitializer<T> {
    private _f: (() => T) | undefined
    private _value: T | undefined = undefined

    constructor(f: () => T)  {
        this._f = f
    }

    get value(): T {
        if (!this._value) {
            this._value = this._f!()
            delete this._f
        }
        return this._value
    }
}

function Lazy<T extends object>(f: (() => T)) {
    const t = new LazyInitializer<T>(f)

    return new Proxy(t.value, {
        get(target, prop) {
            return (target as any)[prop];
        },
        set(target, prop, value) {
            (target as any)[prop] = value;
            return true; // Indicate success
        },
    })
}

export { Lazy }
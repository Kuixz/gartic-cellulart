

class Lazy<T> {
    f: (() => T) | undefined
    lazyValue: T | undefined = undefined

    constructor(f: () => T)  {
        this.f = f
    }

    get value(): T {
        if (!this.lazyValue) {
            this.lazyValue = this.f!()
            delete this.f
        }
        return this.lazyValue
    }
}

export { Lazy }
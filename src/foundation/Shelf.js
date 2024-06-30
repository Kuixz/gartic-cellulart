

const Shelf = { // FAKE SHELF - REMOVE THIS WHEN PUSHING BETA 
    dict: { 
        auth: "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb",
        p: "q",
    },

    async set(items) { // Dictionary<String, any>
        for (const key in items) {
            Shelf.dict[key] = items[key]
        }
    },
    async get(items) { // [String]
        switch (typeof items) {
            case 'string':
                // t[items] = Shelf.dict[items]
                // break;
                return Shelf.dict[items]
            case 'object':
                var t = {}
                items.forEach((key) => {
                    t[key] = Shelf.dict[key]
                })
                return t
                // break;
            default:
                return Shelf.dict
                // break;
        }
        // return t
    },
    async remove(items) { // [String]
        for (const key in items) {
            delete Shelf.dict[key]
        }
    },
    async clear() {
        Shelf.dict = { }
    },
    async retrieveOrElse(key, defaultValue, write = false) {
        if (key in Shelf.dict) { return Shelf.data[key] }
        if (write) { Shelf[key] = defaultValue }
        return defaultValue
    }
}

// const Shelf = {
//     // init() {
//     //     ;["session", "local"].forEach((zone) => {
//     //         Box[zone] = { }
//     //         ;["set, get"].forEach((func) => {
//     //             Box[zone][func] = async function(items) { chrome.storage[zone][func](items) }
//     //         })
//     //     })
//     // },

//     async set(items) { // Dictionary<String, any>
//         return await chrome.storage.local.set(items)
//     },
//     async get(items) { // [String]
//         return await chrome.storage.local.get(items)
//     },
//     async remove(items) { // [String]
//         return await chrome.storage.local.remove(items)
//     },
//     async clear() {
//         chrome.storage.local.clear()
//     },
//     async retrieveOrElse(key, defaultValue, write = false) {
//         const data = await chrome.storage.local.get(key)
//         if (data[key] !== undefined) { return data[key] }
//         if (write) { chrome.storage.local.set({ [key]:defaultValue }) }
//         return defaultValue
//     }
// }

export default Shelf
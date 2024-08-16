enum Phase {
    Start = "start",
    Lobby = "lobby",
    Draw = "draw",
    Write = "write",
    Memory = "memory",
    Book = "book",
}

const svgNS = "http://www.w3.org/2000/svg"
const configChildTrunk = { childList: true };

export { Phase, svgNS, configChildTrunk }
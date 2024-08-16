/**
 * @jest-environment jsdom
 */
const socket = require(PATH + '/src/branches/injected/socket.js');
Object.assign(global, socket)

test('proxification', () => {
    expect(Socket).toBeDefined()
    expect(WebSocket.prototype.expressSend).toBeDefined()
});

test ('intercept outgoing', () => {
    // const ws = new WebSocket();
})

test ('intercept incoming', () => {
    
})

// test('stroke count', () => {
//     expect(false).toBe(true)
// })
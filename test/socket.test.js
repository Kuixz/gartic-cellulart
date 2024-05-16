/**
 * @jest-environment jsdom
 */
const socket = require(PATH + '/src/branches/injected/socket.js');
Object.assign(global, socket)

test('proxification', () => {
    expect(Socket).toBeDefined()
    expect(WebSocket.prototype.expressSend).toBeDefined()
});

// test('stroke count', () => {
//     expect(false).toBe(true)
// })
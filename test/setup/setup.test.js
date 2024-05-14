const sum = require('./sum.js');

const foundation = require('../../src/content/foundation.js');
Object.assign(global, foundation)

test('jest', () => {
    expect(sum(1, 2)).toBe(3);
});
// test('emca-modules', () => {
//     expect(gifenc).toBeDefined();
// });
test('namespace', () => {
    expect(svgNS).toBe("http://www.w3.org/2000/svg");
});
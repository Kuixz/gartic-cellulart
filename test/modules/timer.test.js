
const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

const modules = require(PATH + '/src/content/modules.js');
Object.assign(global, modules)

test('phase transition', () => {
    
})

test('decay', () => {

    document.body.innerHTML =
    '<div class="step">' +
    '  <p>1/10<p/>' +
    '</div>';

    Timer.parameters = {    
        write: 90,          
        draw: 300,           
        turns: (players) => players,
        decay: (turns) => 1 / Math.exp(8 / turns),
        firstMultiplier: 1 
    }
    // Timer.finalizeTurns(10);
    // expect(Timer.parameters.draw instanceof Number).toBe(true)
    // expect(Timer.parameters.decat instanceof function).toBe(false)
    Timer.finalizeTurns();
    expect(Timer.parameters.decay instanceof Function).toBe(false)
    // expect(Timer.parameters.draw instanceof Number).toBe(true)
    for (var count = 0; count < 10; count ++) {
        // Timer.mutation('draw','draw')
        Timer.interpolate(1)
    }
    expect(Math.abs(30 - Timer.parameters.draw)).toBeLessThan(0.1)

    Timer.parameters.write = 90
    Timer.parameters.draw = 300
    for (var count = 0; count < 10; count ++) {
        Timer.mutation('draw','draw')
    }
    setTimeout(
        () => { expect(Math.abs(30 - Timer.parameters.draw)).toBeLessThan(0.1) },
        300
    )
})
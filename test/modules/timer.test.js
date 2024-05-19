
const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

const modules = require(PATH + '/src/content/modules.js');
Object.assign(global, modules)

test('phase transition', () => {
    
})

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout')

test('decay', () => {

    document.body.innerHTML =
    '<div>' +
    '   <div class="time"> </div>' +
    '   <div class="step">' +
    '   <p>1/10<p/>' +
    '   </div>' + 
    '</div>';

    Timer.parameters = { 
        players: 10,   
        write: 90,          
        draw: 300,           
        turnsFunction: (players) => players,
        decayFunction: (turns) => 1 / Math.exp(8 / turns),
        firstMultiplier: 1 
    }
    // Timer.finalizeTurns(10);
    // expect(Timer.parameters.draw instanceof Number).toBe(true)
    // expect(Timer.parameters.decat instanceof function).toBe(false)
    Timer.finalizeTurns();
    jest.runAllTimers();
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
    jest.runAllTimers();
    expect(Math.abs(30 - Timer.parameters.draw)).toBeLessThan(0.1)
    // setTimeout(
    //     () => { expect(Math.abs(30 - Timer.parameters.draw)).toBeLessThan(0.1) },
    //     300
    // )
})
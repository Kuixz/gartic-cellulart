
const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

const modules = require(PATH + '/src/content/modules.js');
Object.assign(global, modules)

test('phase transition', () => {
    
})

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout')

test('decay detection',() => {
    
})

test('decay', () => {

    document.body.innerHTML =
    '<div>' +
    '   <div class="time"> </div>' +
    '   <div class="step">' +
    '   <p>1/10<p/>' +
    '   </div>' + 
    '</div>';

    Object.assign(Timer, { 
        players: 10,   
        write: 90,          
        draw: 300,           
        // turnsFunction: (players) => players,
        turns: 10,
        decay: 1 / Math.exp(8 / 10),
        // decayFunction: (turns) => 1 / Math.exp(8 / turns),
        firstMultiplier: 1 
    })
    // Timer.finalizeTurns(10);
    // expect(Timer.draw instanceof Number).toBe(true)
    // expect(Timer.decat instanceof function).toBe(false)
    // Timer.finalizeTurns();
    jest.runAllTimers();
    // expect(Timer.decay instanceof Function).toBe(false)
    // expect(Timer.draw instanceof Number).toBe(true)

    for (var count = 0; count < 10; count ++) {
        // Timer.mutation('draw','draw')
        Timer.interpolate(1)
    }
    expect(Math.abs(30 - Timer.draw)).toBeLessThan(0.1)

    Timer.write = 90
    Timer.draw = 300
    for (var count = 0; count < 10; count ++) {
        Timer.mutation('draw','draw')
    }
    jest.runAllTimers();
    expect(Math.abs(30 - Timer.draw)).toBeLessThan(0.1)
    // setTimeout(
    //     () => { expect(Math.abs(30 - Timer.draw)).toBeLessThan(0.1) },
    //     300
    // )
})
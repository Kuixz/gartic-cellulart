/**
 * @jest-environment node
 */

const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

test('Shelf get', async () => {
    var res = await Shelf.get('p')
    expect(res).toBe('q');
});

test('Shelf set', async () => {
    await Shelf.set({ 'test':200 })
    var res = await Shelf.get('test')
    expect(res).toBe(200);
});

test('SHAuth using', async() => {
    SHAuth.using(Shelf)
    expect(SHAuth.storage).toEqual(Shelf)
})

test('SHAuth remember', async() => {
    await SHAuth.remember("test 200")
    var res = await Shelf.get('auth')
    expect(res).toBe('test 200')
})

test('SHAuth validate incorrect', async() => {
    await SHAuth.remember("incorrect")
    // var res = await Shelf.get('auth')
    // expect(res).toBe('incorrect')
    expect(await SHAuth.tryLogin()).toBe(false)
})

test('SHAuth authenticate incorrect', async() => {
    expect(await SHAuth.authenticate('incorrect')).toBe(false)
})

test('SHAuth validate correct', async() => {
    await SHAuth.remember(SHAuth.hash)
    // var res = await Shelf.get('auth')
    // expect(res).toBe(SHAuth.hash)
    expect(await SHAuth.tryLogin()).toBe(true)
})

test('SHAuth authenticate correct', async() => {
    await SHAuth.remember('correct')
    expect(await SHAuth.authenticate('Satellite')).toBe(true)
})

test('SHAuth authenticate redundant', async() => {
    expect(await SHAuth.authenticate('incorrect')).toBe(true)
})
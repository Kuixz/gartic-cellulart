
import { JSDOM } from "jsdom"
import { test, expect, beforeAll } from 'vitest'

beforeAll(async () => {
    const jsdom = await JSDOM.fromFile('/Users/zacharytsang/dev/HTML:CSS:JS/cellulart megafolder/cellulart/tests/test.html', { contentType: 'text/html' })
    // await new Promise(resolve =>
    //     jsdom.window.addEventListener("load", resolve)
    // );
    window.document = jsdom.window.document
})

test('JSDOM setup', () => {
    expect(document.getElementById("poop")).not.toBeNull()
});
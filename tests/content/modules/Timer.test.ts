
import { JSDOM } from "jsdom"
import { Timer } from "../../../src/content/modules"
import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest'

beforeAll(async () => {
    const jsdom = await JSDOM.fromFile('/Users/zacharytsang/dev/HTML:CSS:JS/cellulart megafolder/cellulart/tests/content/draw.html', { contentType: 'text/html' })
    window.document = jsdom.window.document
})

test('JSDOM setup', () => {
    expect(document.getElementsByTagName("div")).not.toBe([])
});

import { Console } from "../../../src/content/foundation"
import { describe, test, expect, vi } from 'vitest'

global.console.log = () => {}
global.console.warn = () => {}
const consoleLogs = vi.spyOn(console, "log")
const consoleWarns = vi.spyOn(console, "warn")

describe("No module given", () => {
    consoleLogs.mockClear()
    consoleWarns.mockClear()
    
    test("Log calls log", () => {
        Console.log("a")
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(0)
    })

    test("Alert calls alert", () => {
        Console.warn("a")
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(1)
    })
})

describe("Module given", () => {
    const testAllowName = "testName1"
    const testBlockName = "testName2"
    Console.set(testAllowName, true)
    Console.set(testBlockName, false)

    consoleLogs.mockClear()
    consoleWarns.mockClear()

    test("Log allowed name passes", () => {
        consoleLogs.mockClear()  // Why is this necessary
        consoleWarns.mockClear()

        Console.log("a", testAllowName)
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(0)
    })

    test("Log blocked name blocks", () => {
        Console.log("a", testBlockName)
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(0)
    })

    test("Alert allowed name alerts", () => {
        Console.warn("a", testAllowName)
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(1)
    })

    test("Alert blocked name alerts anyway", () => {
        Console.warn("a", testBlockName)
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(2)
    })
})

describe("Module toggling", () => {
    const testName = "testName1"
    Console.set(testName, false)
    Console.toggle(testName)

    consoleLogs.mockClear()
    consoleWarns.mockClear()

    test("Enableable", () => {
        consoleLogs.mockClear()
        consoleWarns.mockClear()

        Console.log("a", testName)
        expect(consoleLogs.mock.calls.length).toBe(1)
        expect(consoleWarns.mock.calls.length).toBe(0)
    })

    test("Disableable", () => {
        Console.toggle(testName)
        consoleLogs.mockClear()
        consoleWarns.mockClear()

        Console.log("a", testName)
        expect(consoleLogs.mock.calls.length).toBe(0)
        expect(consoleWarns.mock.calls.length).toBe(0)
    })
})

// Unspecified name is unspecified behaviour

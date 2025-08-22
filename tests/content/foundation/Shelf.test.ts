import { SandShelf as Shelf } from "../../../src/content/foundation";
import { test, expect } from "vitest";

// test('chrome is mocked', () => {
//     expect(chrome).toBeDefined()
//     expect(window.chrome).toBeDefined()
//     expect(chrome.storage.local).toBeDefined()
// })
const shelf = new Shelf();

// For testing it's better to just use SandShelf.
// Although I now have to manually verify that SandShelf behaves like chrome.storage.local.

// test ("chrome set and get", async() => {
//     await chrome.storage.local.set({ "a":"b" })
//     const res = await chrome.storage.local.get()
//     expect(res["a"]).toBe("b")
// })

test("Shelf set and get", async () => {
  await shelf.set({ a: "b" });
  const res = await shelf.get("a");
  expect(res["a"]).toBe("b");
});

test("Shelf get unset", async () => {
  var res = await shelf.get("200");
  expect(res["200"]).toBeUndefined();
});

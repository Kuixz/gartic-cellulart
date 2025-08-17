import { Setting, SettingsBelt } from "../../../src/content/foundation";
import { describe, test, expect, beforeEach, assert } from "vitest";

describe("Without extension", () => {
  var belt: SettingsBelt;

  beforeEach(() => {
    belt = new SettingsBelt(
      [
        new Setting("name1", "asset1"),
        new Setting("name2", "asset2"),
        new Setting("name3", "asset3"),
      ],
      0,
    );
  });

  test("Getting current state", () => {
    expect(belt.current.internalName).toBe("name1");
    expect(belt.isSetTo("name1")).toBeTruthy();
  });

  test("Marching", () => {
    belt.next();
    expect(belt.isSetTo("name2")).toBeTruthy();
  });

  test("Backmarching", () => {
    belt.prev();
    expect(belt.isSetTo("name3")).toBeTruthy();
  });

  test("Extending and retracting", () => {
    belt.extend();
    expect(belt.length).toBe(3);
    belt.retract();
    expect(belt.length).toBe(3);
  });
});

describe("With extension", () => {
  var belt: SettingsBelt;

  beforeEach(() => {
    belt = new SettingsBelt(
      [new Setting("name1", "asset1"), new Setting("name2", "asset2")],
      0,
      new Setting("name3", "asset3"),
    );
  });

  test("Extending and retracting", () => {
    belt.extend();
    expect(belt.length).toBe(3);
    belt.retract();
    expect(belt.length).toBe(2);
  });

  test("Marching when set to end", () => {
    belt.extend();
    belt.next();
    belt.next();
    expect(belt.isSetTo("name3")).toBeTruthy();
    belt.retract();
    belt.next();
    expect(belt.isSetTo("name1")).toBeTruthy();
  });

  test("Backmarching when set to end", () => {
    belt.extend();
    belt.next();
    belt.next();
    expect(belt.isSetTo("name3")).toBeTruthy();
    belt.retract();
    belt.prev();
    expect(belt.isSetTo("name2")).toBeTruthy();
  });
});

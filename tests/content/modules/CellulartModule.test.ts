import { CellulartModule } from "../../../src/content/modules";
import {
  DefaultSettings,
  Phase,
  RedSettingsBelt,
} from "../../../src/content/foundation";
import { describe, test, expect, beforeAll, vi } from "vitest";

class MinimalModule extends CellulartModule {
  name = "Minimal";
  setting = RedSettingsBelt("Minimal", false);

  mutation(oldPhase: Phase, newPhase: Phase): void {}
  roundStart(): void {}
  roundEnd(oldPhase: Phase): void {}
  adjustSettings(previous: string, current: string): void {}
}

var mod: MinimalModule;

beforeAll(() => {
  // @ts-ignore
  window.chrome = { runtime: { getURL: (a) => a } };
});

describe("State logic", () => {
  beforeAll(() => {
    mod = new MinimalModule();
  });
  test("State getters", () => {
    expect(mod.isSetTo(DefaultSettings.off)).toBeTruthy();
    expect(mod.isSetTo(DefaultSettings.on)).toBeFalsy();
    expect(mod.isOff()).toBeTruthy();
    expect(mod.isOn()).toBeFalsy();
    expect(mod.isRed()).toBeFalsy();
  });
  test("State transition", () => {
    const adjustLogger = vi.spyOn(mod, "adjustSettings");

    mod.menuStep();

    expect(mod.isSetTo(DefaultSettings.off)).toBeFalsy();
    expect(mod.isSetTo(DefaultSettings.on)).toBeTruthy();
    expect(mod.isOff()).toBeFalsy();
    expect(mod.isOn()).toBeTruthy();
    expect(mod.isRed()).toBeFalsy();

    expect(adjustLogger.mock.calls.length).toBe(1);
  });
});

test("Toggle plus", () => {
  mod = new MinimalModule();

  mod.togglePlus(true);
  expect(mod.setting.length).toBe(3);
  mod.menuStep();
  mod.menuStep();
  expect(mod.isSetTo(DefaultSettings.red)).toBe(true);

  mod.togglePlus(false);
  expect(mod.setting.length).toBe(2);
  mod.menuStep();
  expect(mod.isSetTo(DefaultSettings.off)).toBe(true);
});

import { describe, expect, it, vi, afterEach } from "vitest";
import { getTimeLeft } from "../timer";

describe("getTimeLeft", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "00:00" when the time already passed', () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    expect(getTimeLeft(9_000)).toBe("00:00");
  });

  it("returns formatted minutes and seconds for a future time", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    // 2 minutes and 5 seconds later
    expect(getTimeLeft(135_000)).toBe("02:05");
  });

  it("pads single-digit seconds with a leading zero", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    // 1 minute and 9 seconds later
    expect(getTimeLeft(79_000)).toBe("01:09");
  });
});
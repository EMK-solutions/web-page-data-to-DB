import { describe, expect, it } from "vitest";
import { absolutePostedDate, calendarDateOrNull, localCalendarDate } from "@/src/capture/date";
import { normalizeFields } from "@/src/capture/fields";

describe("posted date", () => {
  it("uses the local calendar date", () => {
    const local = new Date(2026, 9, 27, 0, 30, 0);
    expect(localCalendarDate(local)).toBe("2026-10-27");
    const utcDay = local.toISOString().slice(0, 10);
    if (utcDay !== "2026-10-27") {
      expect(localCalendarDate(local)).not.toBe(utcDay);
    }
  });

  it("keeps a real calendar date and rejects an invented day", () => {
    expect(calendarDateOrNull("2026-10-26")).toBe("2026-10-26");
    expect(calendarDateOrNull(" 2024-02-29 ")).toBe("2024-02-29");
    expect(calendarDateOrNull("2026-02-31")).toBeNull();
    expect(calendarDateOrNull("2026-02-29")).toBeNull();
    expect(calendarDateOrNull("3 days ago")).toBeNull();
    expect(calendarDateOrNull("")).toBeNull();
    expect(calendarDateOrNull("2026-10-23T08:00:00Z")).toBeNull();
  });

  it("reads an absolute JSON-LD date and leaves relative text alone", () => {
    expect(absolutePostedDate("2026-10-23")).toBe("2026-10-23");
    expect(absolutePostedDate("2026-10-23T08:00:00Z")).toBe("2026-10-23");
    expect(absolutePostedDate("2026-02-31")).toBeNull();
    expect(absolutePostedDate("3 days ago")).toBeNull();
    expect(absolutePostedDate(20261023)).toBeNull();
  });

  it("stores null when a field value is not a calendar date", () => {
    expect(normalizeFields({ jobPostedDate: "2026-02-31" }).jobPostedDate).toBeNull();
    expect(normalizeFields({ jobPostedDate: "2026-10-26" }).jobPostedDate).toBe("2026-10-26");
  });
});

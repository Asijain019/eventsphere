import { describe, expect, it } from "vitest";
import { collegesForCity } from "@/components/auth/college-options";

describe("collegesForCity", () => {
  const colleges = [
    { id: "a", name: "College A", cityId: "city-a" },
    { id: "b", name: "College B", cityId: "city-b" },
  ];

  it("only returns colleges belonging to the selected city", () => {
    expect(collegesForCity(colleges, "city-a")).toEqual([colleges[0]]);
  });

  it("returns no colleges until a city is selected", () => {
    expect(collegesForCity(colleges, "")).toEqual([]);
  });
});

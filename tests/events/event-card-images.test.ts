import { describe, expect, it } from "vitest";
import { withDistinctEventPosters } from "@/lib/event-card-images";

describe("withDistinctEventPosters", () => {
  it("preserves unique uploaded posters and replaces duplicate images", () => {
    const events = [
      { id: "one", posterUrl: "https://cdn.example/events/poster.jpg?version=1", categorySlug: "dance-performing-arts" },
      { id: "two", posterUrl: "https://cdn.example/events/poster.jpg?version=2", categorySlug: "dance-performing-arts" },
      { id: "three", posterUrl: "https://cdn.example/events/another.jpg", categorySlug: "dance-performing-arts" },
    ];

    const result = withDistinctEventPosters(events);

    expect(result[0].posterUrl).toBe(events[0].posterUrl);
    expect(result[1].posterUrl).not.toBe(events[1].posterUrl);
    expect(result[2].posterUrl).toBe(events[2].posterUrl);
    expect(new Set(result.map((event) => event.posterUrl)).size).toBe(3);
  });

  it("assigns different category artwork when several events have no uploaded poster", () => {
    const events = [
      { id: "one", posterUrl: null, categorySlug: "dance-performing-arts" },
      { id: "two", posterUrl: null, categorySlug: "dance-performing-arts" },
    ];

    const result = withDistinctEventPosters(events);

    expect(result[0].posterUrl).not.toBeNull();
    expect(result[1].posterUrl).not.toBe(result[0].posterUrl);
  });
});

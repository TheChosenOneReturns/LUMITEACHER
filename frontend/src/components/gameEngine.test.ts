import { describe, expect, it } from "vitest";
import { sample, shuffled } from "./gameEngine";

describe("replayable game engine", () => {
  it("keeps one session deterministic but changes with a new seed", () => {
    const source = [1, 2, 3, 4, 5, 6];
    expect(shuffled(source, "session-a")).toEqual(shuffled(source, "session-a"));
    expect(shuffled(source, "session-a")).not.toEqual(shuffled(source, "session-b"));
  });

  it("selects the requested number of unique challenges", () => {
    const result = sample(["a", "b", "c", "d", "e"], 3, "round-2");
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });
});

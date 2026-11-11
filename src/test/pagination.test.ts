import { expect, it } from "vitest";
import { getPageLinks } from "../lib/paginateIssues";

it("shows a seven-page window with jump links around the middle page", () => {
    expect(getPageLinks(101, 12)).toEqual([
        1, "ellipsis", 10, 11, 12, 13, 14, 15, 16, "ellipsis", 101,
    ]);
});

it("keeps the first and last pages reachable without unnecessary ellipses", () => {
    expect(getPageLinks(101, 0)).toEqual([1, 2, 3, 4, "ellipsis", 101]);
    expect(getPageLinks(101, 100)).toEqual([1, "ellipsis", 98, 99, 100, 101]);
    expect(getPageLinks(7, 3)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPageLinks(0, 0)).toEqual([]);
});

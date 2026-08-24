import { describe, expect, it } from "vitest";
import { calculate, project, type GradeCategoryInput, type GradeItemInput } from "./grades";

function cat(
  partial: Partial<GradeCategoryInput> & Pick<GradeCategoryInput, "id" | "weightPct">,
): GradeCategoryInput {
  return {
    dropLowestN: 0,
    replacesLowestInCategoryId: null,
    ...partial,
  };
}

function item(
  partial: Partial<GradeItemInput> & Pick<GradeItemInput, "id" | "categoryId">,
): GradeItemInput {
  return {
    score: null,
    max: null,
    ...partial,
  };
}

describe("calculate", () => {
  it("returns null standing and 0% determined for an empty course", () => {
    const result = calculate([], []);
    expect(result.standing).toBeNull();
    expect(result.determinedPct).toBe(0);
    expect(result.categories).toEqual([]);
  });

  it("computes standing from one graded item", () => {
    const categories = [cat({ id: "hw", weightPct: 100 })];
    const items = [item({ id: "a1", categoryId: "hw", score: 8, max: 10 })];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(0.8);
    expect(result.determinedPct).toBeCloseTo(100);
  });

  it("omits ungraded work instead of counting it as zero", () => {
    const categories = [cat({ id: "hw", weightPct: 100 })];
    const items = [
      item({ id: "a1", categoryId: "hw", score: 10, max: 10 }),
      item({ id: "a2", categoryId: "hw" }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(1);
    expect(result.determinedPct).toBeCloseTo(50);
  });

  it("drops the lowest 1 of 3 graded items", () => {
    const categories = [cat({ id: "quiz", weightPct: 100, dropLowestN: 1 })];
    const items = [
      item({ id: "q1", categoryId: "quiz", score: 5, max: 10 }),
      item({ id: "q2", categoryId: "quiz", score: 9, max: 10 }),
      item({ id: "q3", categoryId: "quiz", score: 10, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(0.95);
    expect(result.categories[0].droppedCount).toBe(1);
    expect(result.categories[0].keptCount).toBe(2);
  });

  it("omits a category when drop n covers every graded item", () => {
    const categories = [
      cat({ id: "quiz", weightPct: 40, dropLowestN: 2 }),
      cat({ id: "exam", weightPct: 60 }),
    ];
    const items = [
      item({ id: "q1", categoryId: "quiz", score: 1, max: 10 }),
      item({ id: "q2", categoryId: "quiz", score: 2, max: 10 }),
      item({ id: "e1", categoryId: "exam", score: 8, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(0.8);
    expect(result.categories.find((c) => c.categoryId === "quiz")?.average).toBeNull();
  });

  it("breaks ratio ties by lower max, then by id", () => {
    const categories = [cat({ id: "quiz", weightPct: 100, dropLowestN: 1 })];
    const items = [
      item({ id: "b", categoryId: "quiz", score: 5, max: 10 }),
      item({ id: "a", categoryId: "quiz", score: 5, max: 10 }),
      item({ id: "c", categoryId: "quiz", score: 5, max: 20 }),
    ];
    const result = calculate(categories, items);
    expect(result.categories[0].droppedCount).toBe(1);
    expect(result.standing).toBeCloseTo(0.5);
  });

  it("replaces the lowest kept slot only when the source average is higher", () => {
    const categories = [
      cat({ id: "midterm", weightPct: 40 }),
      cat({ id: "final", weightPct: 60, replacesLowestInCategoryId: "midterm" }),
    ];
    const items = [
      item({ id: "m1", categoryId: "midterm", score: 5, max: 10 }),
      item({ id: "m2", categoryId: "midterm", score: 9, max: 10 }),
      item({ id: "f1", categoryId: "final", score: 10, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(0.98);
  });

  it("does not replace when the source average is not higher", () => {
    const categories = [
      cat({ id: "midterm", weightPct: 40 }),
      cat({ id: "final", weightPct: 60, replacesLowestInCategoryId: "midterm" }),
    ];
    const items = [
      item({ id: "m1", categoryId: "midterm", score: 9, max: 10 }),
      item({ id: "m2", categoryId: "midterm", score: 10, max: 10 }),
      item({ id: "f1", categoryId: "final", score: 5, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo((40 * 0.95 + 60 * 0.5) / 100);
  });

  it("applies drop before replace", () => {
    const categories = [
      cat({ id: "quiz", weightPct: 50, dropLowestN: 1 }),
      cat({ id: "final", weightPct: 50, replacesLowestInCategoryId: "quiz" }),
    ];
    const items = [
      item({ id: "q1", categoryId: "quiz", score: 2, max: 10 }),
      item({ id: "q2", categoryId: "quiz", score: 6, max: 10 }),
      item({ id: "q3", categoryId: "quiz", score: 8, max: 10 }),
      item({ id: "f1", categoryId: "final", score: 10, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo((50 * 0.9 + 50 * 1) / 100);
  });

  it("applies multiple sources to one target greedily in id order", () => {
    const categories = [
      cat({ id: "a-source", weightPct: 20, replacesLowestInCategoryId: "target" }),
      cat({ id: "b-source", weightPct: 20, replacesLowestInCategoryId: "target" }),
      cat({ id: "target", weightPct: 60 }),
    ];
    const items = [
      item({ id: "t1", categoryId: "target", score: 2, max: 10 }),
      item({ id: "t2", categoryId: "target", score: 4, max: 10 }),
      item({ id: "t3", categoryId: "target", score: 9, max: 10 }),
      item({ id: "a1", categoryId: "a-source", score: 10, max: 10 }),
      item({ id: "b1", categoryId: "b-source", score: 8, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo((20 * 1 + 20 * 0.8 + 60 * 0.9) / 100);
  });

  it("ignores uncategorized items", () => {
    const categories = [cat({ id: "hw", weightPct: 100 })];
    const items = [
      item({ id: "a1", categoryId: "hw", score: 8, max: 10 }),
      item({ id: "orphan", categoryId: null, score: 0, max: 10 }),
    ];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(0.8);
  });

  it("allows score above max as extra credit on an item", () => {
    const categories = [cat({ id: "hw", weightPct: 100 })];
    const items = [item({ id: "a1", categoryId: "hw", score: 12, max: 10 })];
    const result = calculate(categories, items);
    expect(result.standing).toBeCloseTo(1.2);
  });

  it("computes determined share using drop_lowest_n in the denominator", () => {
    const categories = [cat({ id: "quiz", weightPct: 40, dropLowestN: 1 })];
    const items = [
      item({ id: "q1", categoryId: "quiz", score: 10, max: 10 }),
      item({ id: "q2", categoryId: "quiz", score: 8, max: 10 }),
      item({ id: "q3", categoryId: "quiz" }),
    ];
    const result = calculate(categories, items);
    expect(result.determinedPct).toBeCloseTo(20);
  });

  it("does not mutate inputs", () => {
    const categories = [cat({ id: "hw", weightPct: 100, dropLowestN: 1 })];
    const items = [
      item({ id: "a1", categoryId: "hw", score: 5, max: 10 }),
      item({ id: "a2", categoryId: "hw", score: 9, max: 10 }),
    ];
    const catsBefore = structuredClone(categories);
    const itemsBefore = structuredClone(items);
    calculate(categories, items);
    expect(categories).toEqual(catsBefore);
    expect(items).toEqual(itemsBefore);
  });
});

describe("project", () => {
  it("flags a target as unreachable when even 100% on remaining falls short", () => {
    const categories = [
      cat({ id: "exam", weightPct: 80 }),
      cat({ id: "hw", weightPct: 20 }),
    ];
    const items = [
      item({ id: "e1", categoryId: "exam", score: 4, max: 10 }),
      item({ id: "h1", categoryId: "hw" }),
    ];
    const result = project(categories, items, 0.9);
    expect(result.unreachable).toBe(true);
    expect(result.requiredRatio).toBeNull();
    expect(result.maxPossible).toBeCloseTo(0.52);
  });

  it("flags a target as already locked when even 0% on remaining still hits it", () => {
    const categories = [
      cat({ id: "exam", weightPct: 80 }),
      cat({ id: "hw", weightPct: 20 }),
    ];
    const items = [
      item({ id: "e1", categoryId: "exam", score: 10, max: 10 }),
      item({ id: "h1", categoryId: "hw" }),
    ];
    const result = project(categories, items, 0.7);
    expect(result.alreadyLocked).toBe(true);
    expect(result.requiredRatio).toBeNull();
    expect(result.minPossible).toBeCloseTo(0.8);
  });

  it("finds the uniform required ratio on remaining items", () => {
    const categories = [
      cat({ id: "exam", weightPct: 50 }),
      cat({ id: "hw", weightPct: 50 }),
    ];
    const items = [
      item({ id: "e1", categoryId: "exam", score: 8, max: 10 }),
      item({ id: "h1", categoryId: "hw" }),
    ];
    const result = project(categories, items, 0.85);
    expect(result.unreachable).toBe(false);
    expect(result.alreadyLocked).toBe(false);
    expect(result.requiredRatio).toBeCloseTo(0.9, 4);
  });
});

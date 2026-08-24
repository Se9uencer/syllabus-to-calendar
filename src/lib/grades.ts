export type GradeCategoryInput = {
  id: string;
  weightPct: number;
  dropLowestN: number;
  replacesLowestInCategoryId: string | null;
};

export type GradeItemInput = {
  id: string;
  categoryId: string | null;
  score: number | null;
  max: number | null;
};

export type CategoryStanding = {
  categoryId: string;
  average: number | null;
  keptCount: number;
  droppedCount: number;
  itemCount: number;
  determinedShare: number;
};

export type GradeResult = {
  standing: number | null;
  determinedPct: number;
  categories: CategoryStanding[];
};

export type ProjectionResult = {
  maxPossible: number | null;
  minPossible: number | null;
  requiredRatio: number | null;
  unreachable: boolean;
  alreadyLocked: boolean;
};

type KeptSlot = {
  id: string;
  ratio: number;
  max: number;
  replaced: boolean;
};

function isGraded(item: GradeItemInput): item is GradeItemInput & {
  score: number;
  max: number;
  categoryId: string;
} {
  return (
    item.categoryId != null &&
    item.score != null &&
    item.max != null &&
    item.max > 0
  );
}

function compareSlots(a: KeptSlot, b: KeptSlot): number {
  if (a.ratio !== b.ratio) return a.ratio - b.ratio;
  if (a.max !== b.max) return a.max - b.max;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function mean(ratios: number[]): number | null {
  if (ratios.length === 0) return null;
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
}

function dropAndAverage(
  categories: GradeCategoryInput[],
  items: GradeItemInput[],
): Map<string, { slots: KeptSlot[]; itemCount: number; droppedCount: number }> {
  const byCategory = new Map<
    string,
    { slots: KeptSlot[]; itemCount: number; droppedCount: number }
  >();

  for (const cat of categories) {
    byCategory.set(cat.id, { slots: [], itemCount: 0, droppedCount: 0 });
  }

  for (const item of items) {
    if (item.categoryId == null) continue;
    const bucket = byCategory.get(item.categoryId);
    if (!bucket) continue;
    bucket.itemCount += 1;
  }

  for (const cat of categories) {
    const bucket = byCategory.get(cat.id)!;
    const graded = items
      .filter(
        (item): item is GradeItemInput & { score: number; max: number; categoryId: string } =>
          isGraded(item) && item.categoryId === cat.id,
      )
      .map((item) => ({
        id: item.id,
        ratio: item.score / item.max,
        max: item.max,
        replaced: false,
      }));

    graded.sort(compareSlots);
    const dropCount = Math.min(Math.max(cat.dropLowestN, 0), graded.length);
    bucket.droppedCount = dropCount;
    bucket.slots = graded.slice(dropCount);
  }

  const sources = [...categories]
    .filter((c) => c.replacesLowestInCategoryId != null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const source of sources) {
    const targetId = source.replacesLowestInCategoryId!;
    const sourceBucket = byCategory.get(source.id);
    const targetBucket = byCategory.get(targetId);
    if (!sourceBucket || !targetBucket) continue;

    const sourceAvg = mean(sourceBucket.slots.map((s) => s.ratio));
    if (sourceAvg == null) continue;

    const candidates = targetBucket.slots
      .filter((s) => !s.replaced)
      .sort(compareSlots);
    const weakest = candidates[0];
    if (!weakest) continue;
    if (sourceAvg <= weakest.ratio) continue;

    weakest.ratio = sourceAvg;
    weakest.replaced = true;
  }

  return byCategory;
}

export function calculate(
  categories: GradeCategoryInput[],
  items: GradeItemInput[],
): GradeResult {
  const byCategory = dropAndAverage(categories, items);
  const categoryStandings: CategoryStanding[] = [];

  let weightedSum = 0;
  let weightTotal = 0;
  let determinedPct = 0;

  for (const cat of categories) {
    const bucket = byCategory.get(cat.id)!;
    const average = mean(bucket.slots.map((s) => s.ratio));
    const effectiveSlots = Math.max(bucket.itemCount - Math.max(cat.dropLowestN, 0), 0);
    const determinedShare =
      effectiveSlots === 0
        ? 0
        : cat.weightPct * (bucket.slots.length / effectiveSlots);

    determinedPct += determinedShare;

    categoryStandings.push({
      categoryId: cat.id,
      average,
      keptCount: bucket.slots.length,
      droppedCount: bucket.droppedCount,
      itemCount: bucket.itemCount,
      determinedShare,
    });

    if (average != null) {
      weightedSum += cat.weightPct * average;
      weightTotal += cat.weightPct;
    }
  }

  return {
    standing: weightTotal === 0 ? null : weightedSum / weightTotal,
    determinedPct,
    categories: categoryStandings,
  };
}

function courseOnSyllabusScale(
  categories: GradeCategoryInput[],
  items: GradeItemInput[],
): number | null {
  const byCategory = dropAndAverage(categories, items);
  let weightedSum = 0;
  let weightTotal = 0;

  for (const cat of categories) {
    const bucket = byCategory.get(cat.id)!;
    const average = mean(bucket.slots.map((s) => s.ratio));
    if (average == null) continue;
    weightedSum += cat.weightPct * average;
    weightTotal += cat.weightPct;
  }

  return weightTotal === 0 ? null : weightedSum / weightTotal;
}

function withTrialRatio(
  items: GradeItemInput[],
  trialRatio: number,
): GradeItemInput[] {
  return items.map((item) => {
    if (item.categoryId == null) return item;
    if (item.score != null && item.max != null && item.max > 0) return item;
    return {
      ...item,
      score: trialRatio,
      max: 1,
    };
  });
}

export function project(
  categories: GradeCategoryInput[],
  items: GradeItemInput[],
  targetRatio: number,
): ProjectionResult {
  const maxPossible = courseOnSyllabusScale(categories, withTrialRatio(items, 1));
  const minPossible = courseOnSyllabusScale(categories, withTrialRatio(items, 0));

  if (maxPossible == null || minPossible == null) {
    return {
      maxPossible,
      minPossible,
      requiredRatio: null,
      unreachable: false,
      alreadyLocked: false,
    };
  }

  if (maxPossible < targetRatio) {
    return {
      maxPossible,
      minPossible,
      requiredRatio: null,
      unreachable: true,
      alreadyLocked: false,
    };
  }

  if (minPossible >= targetRatio) {
    return {
      maxPossible,
      minPossible,
      requiredRatio: null,
      unreachable: false,
      alreadyLocked: true,
    };
  }

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const atMid = courseOnSyllabusScale(categories, withTrialRatio(items, mid));
    if (atMid == null || atMid < targetRatio) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return {
    maxPossible,
    minPossible,
    requiredRatio: hi,
    unreachable: false,
    alreadyLocked: false,
  };
}

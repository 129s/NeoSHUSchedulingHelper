export type CourseBulkItem<TKind extends string = string> = {
	kind: TKind;
	key: string;
};

export type CourseBulkSelection<TItem extends CourseBulkItem> = Map<string, TItem>;

export function bulkItemKey(item: CourseBulkItem): string {
	return `${item.kind}:${item.key}`;
}

export function bulkHas<TItem extends CourseBulkItem>(selection: CourseBulkSelection<TItem>, item: TItem): boolean {
	return selection.has(bulkItemKey(item));
}

export function bulkToggle<TItem extends CourseBulkItem>(
	selection: CourseBulkSelection<TItem>,
	item: TItem
): CourseBulkSelection<TItem> {
	const key = bulkItemKey(item);
	const next = new Map(selection);
	if (next.has(key)) next.delete(key);
	else next.set(key, item);
	return next;
}

export function bulkClear<TItem extends CourseBulkItem>(): CourseBulkSelection<TItem> {
	return new Map();
}

export function bulkSetAll<TItem extends CourseBulkItem>(items: Iterable<TItem>): CourseBulkSelection<TItem> {
	const next = new Map<string, TItem>();
	for (const item of items) next.set(bulkItemKey(item), item);
	return next;
}


export type CourseQuickQueryField = 'courseCode' | 'title' | 'teacher' | 'note';

export type CourseQuickQueryToken =
	| { kind: 'field'; field: CourseQuickQueryField; value: string }
	| { kind: 'any'; value: string };

const FIELD_PREFIXES: Array<{ field: CourseQuickQueryField; prefixes: string[] }> = [
	{ field: 'teacher', prefixes: ['t:', 't：', 'teacher:', 'teacher：', '教师:', '教师：', '老师:', '老师：'] },
	{
		field: 'courseCode',
		prefixes: ['c:', 'c：', 'code:', 'code：', '课程号:', '课程号：', '课号:', '课号：', '课程id:', '课程id：', '课程ID:', '课程ID：', '课程Id:', '课程Id：']
	},
	{ field: 'title', prefixes: ['n:', 'n：', 'name:', 'name：', 'title:', 'title：', '课程名:', '课程名：', '名称:', '名称：'] },
	{ field: 'note', prefixes: ['note:', 'note：', '备注:', '备注：', '说明:', '说明：'] }
];

const PURE_PREFIX_LOOKUP = (() => {
	const map = new Map<string, CourseQuickQueryField>();
	for (const entry of FIELD_PREFIXES) {
		for (const prefix of entry.prefixes) {
			map.set(prefix.trim().toLowerCase(), entry.field);
		}
	}
	return map;
})();

function normalizeToken(value: string) {
	return value.trim().replace(/^["']|["']$/g, '').trim();
}

function splitTokens(input: string) {
	const tokens: string[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;

	const push = () => {
		const value = normalizeToken(current);
		if (value) tokens.push(value);
		current = '';
	};

	for (let index = 0; index < input.length; index += 1) {
		const ch = input[index];
		if (quote) {
			if (ch === quote) {
				quote = null;
				push();
				continue;
			}
			current += ch;
			continue;
		}

		if (ch === '"' || ch === "'") {
			if (current.trim()) push();
			quote = ch;
			continue;
		}

		if (/[\s\u3000,;，；、/|]+/u.test(ch)) {
			push();
			continue;
		}

		current += ch;
	}

	push();
	return tokens;
}

function parseFieldPrefix(raw: string): CourseQuickQueryToken | null {
	const normalized = raw.trim();
	for (const entry of FIELD_PREFIXES) {
		for (const prefix of entry.prefixes) {
			if (!normalized.toLowerCase().startsWith(prefix.toLowerCase())) continue;
			const value = normalizeToken(normalized.slice(prefix.length));
			if (!value) return null;
			return { kind: 'field', field: entry.field, value };
		}
	}
	return null;
}

export function parseCourseQuickQuery(input: string): CourseQuickQueryToken[] {
	const trimmed = input.trim();
	if (!trimmed) return [];
	const pieces = splitTokens(trimmed);
	const tokens: CourseQuickQueryToken[] = [];

	for (let index = 0; index < pieces.length; index += 1) {
		const raw = pieces[index];
		const normalized = raw.trim();
		const pureField = PURE_PREFIX_LOOKUP.get(normalized.toLowerCase());
		if (pureField && index + 1 < pieces.length) {
			const value = normalizeToken(pieces[index + 1]);
			if (value) tokens.push({ kind: 'field', field: pureField, value });
			index += 1;
			continue;
		}

		tokens.push(parseFieldPrefix(raw) ?? { kind: 'any', value: raw });
	}

	return tokens.filter((token) => token.kind !== 'any' || token.value.trim().length > 0);
}

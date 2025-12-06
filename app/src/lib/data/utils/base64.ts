export function encodeBase64(input: string) {
	const globalObj = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
	const bufferCtor = globalObj.Buffer as
		| { from?: (value: string, encoding: string) => { toString: (enc: string) => string } }
		| undefined;
	if (bufferCtor && typeof bufferCtor.from === 'function') {
		return bufferCtor.from(input, 'utf8').toString('base64');
	}
	const btoaFn = globalObj.btoa as ((value: string) => string) | undefined;
	if (typeof btoaFn === 'function') {
		return btoaFn(input);
	}
	throw new Error('无法生成 base64 数据');
}

export function decodeBase64(input: string) {
	const globalObj = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
	const bufferCtor = globalObj.Buffer as
		| { from?: (value: string, encoding: string) => { toString: (enc: string) => string } }
		| undefined;
	if (bufferCtor && typeof bufferCtor.from === 'function') {
		return bufferCtor.from(input, 'base64').toString('utf8');
	}
	const atobFn = globalObj.atob as ((value: string) => string) | undefined;
	if (typeof atobFn === 'function') {
		return atobFn(input);
	}
	throw new Error('无法解码 base64 数据');
}

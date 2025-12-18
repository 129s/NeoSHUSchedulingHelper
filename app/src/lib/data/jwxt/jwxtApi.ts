export type JwxtAccount = {
	userId: string;
	displayName?: string;
};

export type JwxtStatus = {
	supported: boolean;
	loggedIn: boolean;
	account?: JwxtAccount;
	message?: string;
};

export type JwxtApiOk<T> = { ok: true } & T;
export type JwxtApiError = { ok: false; error: string; supported?: boolean };
export type JwxtApiResponse<T> = JwxtApiOk<T> | JwxtApiError;

async function readJson<T>(response: Response): Promise<T> {
	const text = await response.text();
	if (!text) return {} as T;
	return JSON.parse(text) as T;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<JwxtApiResponse<T>> {
	try {
		const response = await fetch(path, {
			...init,
			headers: init?.headers ?? {}
		});
		const text = await response.text();
		if (!text) return { ok: false, error: `HTTP_${response.status}` };
		try {
			return JSON.parse(text) as JwxtApiResponse<T>;
		} catch {
			return { ok: false, error: `HTTP_${response.status}` };
		}
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

export async function jwxtGetStatus(): Promise<JwxtApiResponse<JwxtStatus>> {
	try {
		const response = await fetch('/api/jwxt/status', { method: 'GET' });
		if (response.status === 404) {
			return { ok: true, supported: false, loggedIn: false, message: 'BACKEND_MISSING' };
		}
		const text = await response.text();
		if (!text) return { ok: false, error: `HTTP_${response.status}` };
		return JSON.parse(text) as JwxtApiResponse<JwxtStatus>;
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

export async function jwxtPing(): Promise<
	JwxtApiResponse<{
		ssoEntryStatus: number;
		finalUrl?: string;
		message?: string;
	}>
> {
	return requestJson('/api/jwxt/ping', { method: 'GET' });
}

export async function jwxtLogin(payload: {
	userId: string;
	password: string;
}): Promise<JwxtApiResponse<JwxtStatus>> {
	return requestJson<JwxtStatus>('/api/jwxt/login', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtImportCookie(payload: { userId?: string; cookie: string }): Promise<JwxtApiResponse<JwxtStatus>> {
	return requestJson<JwxtStatus>('/api/jwxt/import-cookie', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtExportCookie(): Promise<JwxtApiResponse<{ cookie: string }>> {
	return requestJson<{ cookie: string }>('/api/jwxt/export-cookie', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({})
	});
}

export async function jwxtLogout(): Promise<JwxtApiResponse<JwxtStatus>> {
	return requestJson<JwxtStatus>('/api/jwxt/logout', { method: 'POST', headers: { 'content-type': 'application/json' } });
}

export type JwxtRoundInfo = {
	xkkzId: string;
	xklc?: string;
	xklcmc?: string;
	kklxdm: string;
	kklxLabel: string;
	active: boolean;
};

export type JwxtRoundsPayload = {
	term: {
		xkxnm?: string;
		xkxqm?: string;
		xkxnmc?: string;
		xkxqmc?: string;
	};
	selectedXkkzId?: string | null;
	activeXkkzId?: string | null;
	rounds: JwxtRoundInfo[];
};

export async function jwxtGetRounds(): Promise<JwxtApiResponse<JwxtRoundsPayload>> {
	return requestJson<JwxtRoundsPayload>('/api/jwxt/rounds', { method: 'GET' });
}

export async function jwxtSelectRound(payload: { xkkzId: string }): Promise<JwxtApiResponse<{ selectedXkkzId: string }>> {
	return requestJson<{ selectedXkkzId: string }>('/api/jwxt/select-round', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export type JwxtSelectedPair = { kchId: string; jxbId: string };

export async function jwxtSyncFromRemote(): Promise<JwxtApiResponse<{ selected: JwxtSelectedPair[] }>> {
	return requestJson('/api/jwxt/sync', { method: 'POST', headers: { 'content-type': 'application/json' } });
}

export type JwxtPushSummary = {
	enrollPlanned: number;
	dropPlanned: number;
	enrollDone: number;
	dropDone: number;
};

export type JwxtPushResult = {
	op: 'enroll' | 'drop';
	kchId: string;
	jxbId: string;
	ok: boolean;
	message?: string;
};

export type JwxtPushPlanItem = {
	kchId: string;
	jxbId: string;
	localCourseId?: string;
	localTitle?: string;
	localTeacher?: string;
	localTime?: string;
};

export type JwxtPushPlan = {
	toEnroll: JwxtPushPlanItem[];
	toDrop: JwxtPushPlanItem[];
};

export async function jwxtPushToRemote(payload: { selectionSnapshotBase64: string; dryRun?: boolean }): Promise<
	JwxtApiResponse<{
		plan: JwxtPushPlan;
		summary: JwxtPushSummary;
		results: JwxtPushResult[];
	}>
> {
	return requestJson('/api/jwxt/push', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtSearch(payload: {
	query: string;
}): Promise<
	JwxtApiResponse<{
		results: Array<{
			kchId: string;
			courseName: string;
			jxbId: string;
			teacher: string;
			time: string;
			credit: string;
		}>;
	}>
> {
	return requestJson('/api/jwxt/search', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtEnroll(payload: { kchId: string; jxbId: string }): Promise<JwxtApiResponse<{ message?: string }>> {
	return requestJson('/api/jwxt/enroll', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtDrop(payload: { kchId: string; jxbId: string }): Promise<JwxtApiResponse<{ message?: string }>> {
	return requestJson('/api/jwxt/drop', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

export async function jwxtCrawlSnapshot(payload: { termId?: string; limitCourses?: number } = {}): Promise<
	JwxtApiResponse<{
		termId: string;
		snapshot: unknown;
	}>
> {
	return requestJson('/api/jwxt/crawl-snapshot', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

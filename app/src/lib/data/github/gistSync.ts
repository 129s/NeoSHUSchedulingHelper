export interface GistSyncConfig {
	gistId?: string;
	token: string;
	files: Record<string, string>;
	description?: string;
	public?: boolean;
}

const API_ROOT = 'https://api.github.com';

export async function syncGist(config: GistSyncConfig) {
	const body = {
		description: config.description ?? 'SHU Course Scheduler data',
		public: config.public ?? false,
		files: Object.fromEntries(Object.entries(config.files).map(([name, content]) => [name, { content }]))
	};

	const headers = {
		Authorization: `token ${config.token}`,
		'Content-Type': 'application/json',
		Accept: 'application/vnd.github+json'
	};

	const endpoint = config.gistId ? `${API_ROOT}/gists/${config.gistId}` : `${API_ROOT}/gists`;
	const method = config.gistId ? 'PATCH' : 'POST';
	const response = await fetch(endpoint, {
		method,
		headers,
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Gist 同步失败: ${response.status} ${response.statusText} - ${error}`);
	}

	const result = (await response.json()) as { id: string };
	return {
		id: result.id,
		url: `https://gist.github.com/${result.id}`
	};
}

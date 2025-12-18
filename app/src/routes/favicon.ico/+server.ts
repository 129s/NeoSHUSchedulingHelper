import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'cache-control': 'public, max-age=3600'
		}
	});
};


import type { RequestHandler } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('github_oauth_state');

	if (!code) {
		return new Response('缺少 code', { status: 400 });
	}

	if (!state || !storedState || state !== storedState) {
		return new Response('state 校验失败', { status: 400 });
	}

	cookies.delete('github_oauth_state', { path: '/' });

	const clientId = publicEnv.PUBLIC_GITHUB_CLIENT_ID;
	const clientSecret = privateEnv.GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return new Response('服务器未配置 GitHub OAuth 凭据', { status: 500 });
	}

	const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code
		})
	});

	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text();
		return new Response(`交换 token 失败：${errorText}`, { status: 500 });
	}

	const tokenJson = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };

	if (!tokenJson.access_token) {
		const message = tokenJson.error_description ?? tokenJson.error ?? 'GitHub 未返回 access_token';
		return new Response(`GitHub 登录失败：${message}`, { status: 400 });
	}

	const payload = {
		type: 'github-token',
		token: tokenJson.access_token
	};

	const script = `
		<!DOCTYPE html>
		<html>
		<body>
		<script>
			(function(){
				if (window.opener) {
					window.opener.postMessage(${JSON.stringify(payload)}, window.location.origin);
				}
				window.close();
			})();
		</script>
		<p>登录成功，可以关闭此页面。</p>
		</body>
		</html>
	`;

	return new Response(script, {
		headers: {
			'Content-Type': 'text/html'
		}
	});
};

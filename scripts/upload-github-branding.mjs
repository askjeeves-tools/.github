import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execSync } from "node:child_process";

const assetsDir = join(import.meta.dirname, "..", "assets");
const org = "askjeeves-tools";
const orgId = "293651550";

function ghToken() {
	if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
	const gh = process.env.GH_PATH ?? "C:\\Program Files\\GitHub CLI\\gh.exe";
	return execSync(`"${gh}" auth token`, { encoding: "utf8" }).trim();
}

function extract(html, pattern) {
	const match = html.match(pattern);
	if (!match?.[1]) throw new Error(`Could not extract ${pattern}`);
	return match[1];
}

async function fetchHtml(url, token) {
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "text/html",
			"User-Agent": "askjeeves-tools-branding-upload",
		},
		redirect: "follow",
	});
	if (!response.ok) {
		throw new Error(`GET ${url} failed: ${response.status}`);
	}
	return response.text();
}

async function uploadOrgAvatar(imagePath, token) {
	const html = await fetchHtml(
		`https://github.com/organizations/${org}/settings/profile`,
		token,
	);
	const policyToken = extract(
		html,
		/data-upload-policy-authenticity-token="([^"]+)"/,
	);
	const scopeId =
		extract(html, /data-scope-id="([^"]+)"/) || orgId;

	const file = readFileSync(imagePath);
	const fileName = basename(imagePath);

	const policyBody = new FormData();
	policyBody.append("name", fileName);
	policyBody.append("size", String(file.length));
	policyBody.append("content_type", "image/png");
	policyBody.append("authenticity_token", policyToken);
	policyBody.append("organization_id", scopeId);
	policyBody.append("owner_type", "Organization");
	policyBody.append("owner_id", scopeId);
	policyBody.append("f", "f");

	const policyResponse = await fetch(
		"https://github.com/upload/policies/avatars",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
				"User-Agent": "askjeeves-tools-branding-upload",
			},
			body: policyBody,
		},
	);
	if (!policyResponse.ok) {
		const text = await policyResponse.text();
		throw new Error(`Avatar policy failed: ${policyResponse.status} ${text}`);
	}
	const policy = await policyResponse.json();

	const uploadBody = new FormData();
	uploadBody.append("authenticity_token", policy.upload_authenticity_token);
	uploadBody.append("owner_type", "Organization");
	uploadBody.append("owner_id", scopeId);
	uploadBody.append("size", String(file.length));
	uploadBody.append("content_type", "image/png");
	uploadBody.append("file", new Blob([file], { type: "image/png" }), fileName);

	const uploadResponse = await fetch("https://uploads.github.com/avatars", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"GitHub-Remote-Auth": policy.header["GitHub-Remote-Auth"],
			Accept: "application/json",
			"User-Agent": "askjeeves-tools-branding-upload",
		},
		body: uploadBody,
	});
	if (!uploadResponse.ok) {
		const text = await uploadResponse.text();
		throw new Error(`Avatar upload failed: ${uploadResponse.status} ${text}`);
	}
	const uploaded = await uploadResponse.json();

	const cropHtml = await fetchHtml(
		`https://github.com/settings/avatars/${uploaded.id}`,
		token,
	);
	const authenticityToken = extract(
		cropHtml,
		/name="authenticity_token" value="([^"]+)"/,
	);
	const cropSize = Math.min(uploaded.width, uploaded.height);
	const cropBody = new URLSearchParams({
		op: "save",
		utf8: "✓",
		authenticity_token: authenticityToken,
		cropped_x: "0",
		cropped_y: "0",
		cropped_width: String(cropSize),
		cropped_height: String(cropSize),
	});

	const cropResponse = await fetch(
		`https://github.com/settings/avatars/${uploaded.id}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": "askjeeves-tools-branding-upload",
			},
			body: cropBody,
			redirect: "manual",
		},
	);
	if (cropResponse.status >= 400) {
		const text = await cropResponse.text();
		throw new Error(`Avatar crop save failed: ${cropResponse.status} ${text}`);
	}

	console.log(`Uploaded org avatar from ${fileName}`);
}

async function uploadRepoSocialPreview(repo, imagePath, token) {
	const html = await fetchHtml(`https://github.com/${repo}/settings`, token);
	const policyToken = extract(
		html,
		/data-upload-policy-authenticity-token="([^"]+)"/,
	);

	const file = readFileSync(imagePath);
	const fileName = basename(imagePath);

	const policyBody = new FormData();
	policyBody.append("name", fileName);
	policyBody.append("size", String(file.length));
	policyBody.append("content_type", "image/png");
	policyBody.append("authenticity_token", policyToken);
	policyBody.append("repository_id", extract(html, /data-repository-id="(\d+)"/));
	policyBody.append("f", "f");

	const policyResponse = await fetch(
		"https://github.com/upload/policies/repository-images",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
				"User-Agent": "askjeeves-tools-branding-upload",
			},
			body: policyBody,
		},
	);
	if (!policyResponse.ok) {
		const text = await policyResponse.text();
		throw new Error(
			`${repo} social policy failed: ${policyResponse.status} ${text}`,
		);
	}
	const policy = await policyResponse.json();

	const uploadBody = new FormData();
	uploadBody.append("authenticity_token", policy.upload_authenticity_token);
	uploadBody.append("size", String(file.length));
	uploadBody.append("content_type", "image/png");
	uploadBody.append("file", new Blob([file], { type: "image/png" }), fileName);

	const uploadResponse = await fetch(
		"https://github.com/upload/repository-images/",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"GitHub-Remote-Auth": policy.header["GitHub-Remote-Auth"],
				Accept: "application/json",
				"User-Agent": "askjeeves-tools-branding-upload",
			},
			body: uploadBody,
		},
	);
	if (!uploadResponse.ok) {
		const text = await uploadResponse.text();
		throw new Error(
			`${repo} social upload failed: ${uploadResponse.status} ${text}`,
		);
	}

	console.log(`Uploaded social preview for ${repo} from ${fileName}`);
}

const token = ghToken();

await uploadOrgAvatar(join(assetsDir, "org-avatar.png"), token);
await uploadRepoSocialPreview(
	"askjeeves-tools/csv-tools",
	join(assetsDir, "social-preview-csv-tools.png"),
	token,
);
await uploadRepoSocialPreview(
	"askjeeves-tools/docx-tools",
	join(assetsDir, "social-preview-docx-tools.png"),
	token,
);

console.log("GitHub branding uploads complete.");

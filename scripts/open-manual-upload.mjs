import { join } from "node:path";
import { execSync } from "node:child_process";

const assetsDir = join(import.meta.dirname, "..", "assets");

const pages = [
	{
		label: "Org avatar",
		url: "https://github.com/organizations/askjeeves-tools/settings/profile",
		file: join(assetsDir, "org-avatar.png"),
	},
	{
		label: "csv-tools social preview",
		url: "https://github.com/askjeeves-tools/csv-tools/settings",
		file: join(assetsDir, "social-preview-csv-tools.png"),
	},
	{
		label: "docx-tools social preview",
		url: "https://github.com/askjeeves-tools/docx-tools/settings",
		file: join(assetsDir, "social-preview-docx-tools.png"),
	},
];

console.log("Opening assets folder and GitHub settings in your default browser.\n");
for (const { label, url, file } of pages) {
	console.log(`- ${label}: ${file}`);
}

if (process.platform === "win32") {
	execSync(
		`powershell -NoProfile -Command "Start-Process explorer.exe -ArgumentList '${assetsDir.replace(/'/g, "''")}'; ${pages.map((p) => `Start-Process '${p.url.replace(/'/g, "''")}'`).join("; ")}"`,
	);
} else if (process.platform === "darwin") {
	execSync(`open "${assetsDir}"`);
	for (const { url } of pages) {
		execSync(`open "${url}"`);
	}
} else {
	execSync(`xdg-open "${assetsDir}"`);
	for (const { url } of pages) {
		execSync(`xdg-open "${url}"`);
	}
}

console.log("\nIn each GitHub tab (signed in with Chrome, Edge, or Firefox):");
console.log("1. Org profile → Upload new picture → org-avatar.png");
console.log("2. csv-tools Settings → Social preview → social-preview-csv-tools.png");
console.log("3. docx-tools Settings → Social preview → social-preview-docx-tools.png");

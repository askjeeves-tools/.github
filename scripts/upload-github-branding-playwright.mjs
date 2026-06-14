import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const root = join(import.meta.dirname, "..");
const assetsDir = join(root, "assets");
const storageStatePath = join(root, ".playwright", "github-auth.json");

async function launchBrowser(headless = false) {
	for (const channel of ["chrome", "msedge"]) {
		try {
			return await chromium.launch({ channel, headless });
		} catch {
			continue;
		}
	}
	throw new Error(
		"Could not launch Chrome or Edge. Use manual upload instead — see BRANDING.md",
	);
}

async function ensureSession() {
	mkdirSync(join(root, ".playwright"), { recursive: true });

	if (existsSync(storageStatePath)) {
		const browser = await launchBrowser(true);
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();
		await page.goto("https://github.com/settings/profile", {
			waitUntil: "domcontentloaded",
		});
		const user = await page.evaluate(
			() => document.querySelector('meta[name="user-login"]')?.content?.trim() || "",
		);
		await browser.close();
		if (user) return storageStatePath;
	}

	const browser = await launchBrowser(false);
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto("https://github.com/login", { waitUntil: "domcontentloaded" });
	console.log("Sign in to GitHub in the opened Chrome/Edge window...");
	await page.waitForFunction(
		() => !!document.querySelector('meta[name="user-login"]')?.content?.trim(),
		undefined,
		{ timeout: 0 },
	);
	await context.storageState({ path: storageStatePath });
	await browser.close();
	return storageStatePath;
}

async function uploadOrgAvatar(page, imagePath) {
	await page.goto(
		"https://github.com/organizations/askjeeves-tools/settings/profile",
		{ waitUntil: "domcontentloaded" },
	);

	const uploadButton = page.getByRole("button", { name: /upload new picture/i });
	if (await uploadButton.count()) {
		const [chooser] = await Promise.all([
			page.waitForEvent("filechooser"),
			uploadButton.click(),
		]);
		await chooser.setFiles(imagePath);
	} else {
		await page.locator('input[type="file"]').first().setInputFiles(imagePath);
	}

	await page.getByRole("button", { name: /^set new organization profile picture$/i }).click({
		timeout: 30_000,
	});
	await page.waitForTimeout(2000);
	console.log("Uploaded org avatar.");
}

async function uploadRepoSocialPreview(page, repo, imagePath) {
	await page.goto(`https://github.com/${repo}/settings`, {
		waitUntil: "domcontentloaded",
	});
	await page.locator("xpath=//h2[normalize-space()='Social preview']").scrollIntoViewIfNeeded();

	const editButton = page.locator("#edit-social-preview-button");
	if (await editButton.count()) {
		await editButton.first().click();
	}

	const fileInput = page.locator("input#repo-image-file-input");
	const uploadMenuItem = page.getByText(/upload an image/i).first();

	if (await fileInput.count()) {
		await fileInput.first().setInputFiles(imagePath);
	} else {
		const [chooser] = await Promise.all([
			page.waitForEvent("filechooser"),
			uploadMenuItem.click(),
		]);
		await chooser.setFiles(imagePath);
	}

	await page.waitForFunction(
		() => !!document.querySelector("input.js-repository-image-id")?.value?.trim(),
		undefined,
		{ timeout: 30_000 },
	);
	console.log(`Uploaded social preview for ${repo}.`);
}

const storageState = await ensureSession();
const browser = await launchBrowser(true);
const context = await browser.newContext({ storageState });
const page = await context.newPage();

try {
	await uploadOrgAvatar(page, join(assetsDir, "org-avatar.png"));
	await uploadRepoSocialPreview(
		page,
		"askjeeves-tools/csv-tools",
		join(assetsDir, "social-preview-csv-tools.png"),
	);
	await uploadRepoSocialPreview(
		page,
		"askjeeves-tools/docx-tools",
		join(assetsDir, "social-preview-docx-tools.png"),
	);
	await context.storageState({ path: storageStatePath });
} finally {
	await browser.close();
}

console.log("GitHub branding uploads complete.");

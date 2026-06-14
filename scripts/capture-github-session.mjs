import { join } from "node:path";
import { chromium } from "playwright";

const profiles = [
	join(process.env.LOCALAPPDATA ?? "", "Microsoft", "Edge", "User Data"),
	join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "User Data"),
];

for (const profile of profiles) {
	try {
		const ctx = await chromium.launchPersistentContext(profile, {
			channel: profile.includes("Edge") ? "msedge" : "chrome",
			headless: true,
			args: ["--profile-directory=Default"],
		});
		const page = await ctx.newPage();
		await page.goto("https://github.com/settings/profile", {
			waitUntil: "domcontentloaded",
			timeout: 20000,
		});
		const user = await page.evaluate(
			() => document.querySelector('meta[name="user-login"]')?.content || "none",
		);
		console.log(profile, "=>", user);
		if (user !== "none") {
			await ctx.storageState({
				path: join(import.meta.dirname, "..", ".playwright", "github-auth.json"),
			});
		}
		await ctx.close();
	} catch (error) {
		console.error(profile, "=> fail:", error.message.split("\n")[0]);
	}
}

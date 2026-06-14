import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "assets");
const source = join(assetsDir, "ask-jeeves-mascot-source.png");

mkdirSync(assetsDir, { recursive: true });

const BG = { r: 13, g: 17, b: 23, alpha: 1 };

async function writeOrgAvatar() {
	await sharp(source)
		.resize(512, 512, { fit: "cover", position: "centre" })
		.png({ compressionLevel: 9 })
		.toFile(join(assetsDir, "org-avatar.png"));
}

async function writeReadmeLogo() {
	const meta = await sharp(source).metadata();
	const height = 120;
	const width = Math.round(((meta.width ?? 825) / (meta.height ?? 845)) * height);
	await sharp(source)
		.resize(width, height, { fit: "inside" })
		.png({ compressionLevel: 9 })
		.toFile(join(assetsDir, "logo-readme.png"));
}

async function writeSocialPreview(title, filename) {
	const width = 1280;
	const height = 640;
	const mascotSlot = Math.round(width * 0.42);
	const textX = mascotSlot + 48;

	const mascot = await sharp(source)
		.resize(mascotSlot - 32, height - 48, {
			fit: "contain",
			background: BG,
		})
		.toBuffer();

	const textSvg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${textX}" y="270" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="68" font-weight="700" fill="#f0f6fc">${escapeXml(title)}</text>
  <text x="${textX}" y="350" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="40" fill="#8b949e">askjeeves.cc</text>
  <text x="${textX}" y="420" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="26" fill="#a371f7">Browser-based · Nothing leaves your device</text>
</svg>`);

	const textLayer = await sharp(textSvg).png().toBuffer();

	await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: BG,
		},
	})
		.composite([
			{ input: mascot, left: 24, top: 24 },
			{ input: textLayer, left: 0, top: 0 },
		])
		.png({ compressionLevel: 9 })
		.toFile(join(assetsDir, filename));
}

function escapeXml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

await writeOrgAvatar();
await writeReadmeLogo();
await writeSocialPreview("CSV Converter", "social-preview-csv-tools.png");
await writeSocialPreview("Word Converter", "social-preview-docx-tools.png");

console.log("Generated brand assets in assets/");

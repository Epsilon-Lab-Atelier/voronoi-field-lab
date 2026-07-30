"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

assert.match(index, /value="bisector">2点の境界</);
assert.match(index, /value="territory">巣を中心にした縄張りモデル</);
assert.match(index, /id="presetGuideTitle"/);
assert.match(index, /epsilonlab-logo\.png\?v=0\.1\.1/);
assert.match(index, /epsilonlab-header\.png\?v=0\.1\.1/);
assert.match(index, />v0\.1\.1</);

assert.match(app, /const VERSION = "0\.1\.1"/);
assert.match(app, /bisector:\s*\[/);
assert.match(app, /title: "巣を中心にした縄張りモデル"/);
assert.match(app, /LEGACY_STORAGE_KEYS/);
assert.doesNotMatch(app, /Delaunay|ドロネー/);

assert.equal(manifest.icons.length, 2);
assert.equal(manifest.icons[0].src, "assets/images/icon-192.png");
assert.equal(manifest.icons[1].src, "assets/images/icon-512.png");

for (const file of [
  "assets/images/epsilonlab-logo.png",
  "assets/images/epsilonlab-header.png",
  "assets/images/favicon.png",
  "assets/images/apple-touch-icon.png",
  "assets/images/icon-192.png",
  "assets/images/icon-512.png",
  "assets/images/og-image.png",
]) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} is missing`);
}

console.log("Voronoi app structure tests passed.");

#!/usr/bin/env node
/**
 * Upstream tracking tool for the ZITADEL Login UI v2 fork.
 *
 * Strategy: git subtree. The upstream repo is added as a remote and the
 * selected ref is materialized into `vendorDir` as a subtree. This keeps a
 * clean, reviewable merge history (unlike a raw copy) while letting us layer
 * our own overrides on top.
 *
 * Commands:
 *   check   Resolve the pinned ref to a commit SHA and compare with upstream.json
 *   vendor  Add/refresh the subtree from upstream into vendorDir
 *   diff    Show what changed upstream since the pinned commit
 *
 * This script only shells out to `git`; it makes no network calls of its own
 * beyond git. It is intentionally conservative: `vendor` refuses to run on a
 * dirty working tree.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..");
const pinPath = join(appDir, "upstream.json");
const REMOTE = "zitadel-login-upstream";

function readPin() {
  return JSON.parse(readFileSync(pinPath, "utf8"));
}

function writePin(pin) {
  writeFileSync(pinPath, JSON.stringify(pin, null, 2) + "\n");
}

function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: appDir,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
  }).trim();
}

function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]);
}

function ensureRemote(repo) {
  const remotes = git(["remote"]).split("\n");
  if (!remotes.includes(REMOTE)) {
    git(["remote", "add", REMOTE, repo]);
  } else {
    git(["remote", "set-url", REMOTE, repo]);
  }
}

function resolveRef(ref) {
  git(["fetch", "--no-tags", REMOTE, ref]);
  return git(["rev-parse", "FETCH_HEAD"]);
}

function assertClean() {
  const status = git(["status", "--porcelain"]);
  if (status) {
    console.error(
      "Working tree is dirty. Commit or stash changes before vendoring."
    );
    process.exit(1);
  }
}

function cmdCheck() {
  const pin = readPin();
  ensureRemote(pin.repo);
  const sha = resolveRef(pin.ref);
  console.log(`repo:          ${pin.repo}`);
  console.log(`ref:           ${pin.ref}`);
  console.log(`upstream HEAD: ${sha}`);
  console.log(`pinnedCommit:  ${pin.pinnedCommit ?? "(none)"}`);
  if (pin.pinnedCommit && pin.pinnedCommit !== sha) {
    console.log("\nUpstream has moved since the last vendor. Run `upstream:diff`.");
    process.exitCode = 2;
  } else if (!pin.pinnedCommit) {
    console.log("\nNever vendored. Run `upstream:vendor` to import.");
  } else {
    console.log("\nUp to date.");
  }
}

function cmdVendor() {
  const pin = readPin();
  assertClean();
  ensureRemote(pin.repo);
  const sha = resolveRef(pin.ref);
  const prefix = join(
    appDir.replace(repoRoot() + "/", ""),
    pin.vendorDir
  );
  const vendorAbs = join(appDir, pin.vendorDir);

  const subtreeArgs = existsSync(vendorAbs)
    ? ["subtree", "pull", "--prefix", prefix, REMOTE, sha, "--squash"]
    : ["subtree", "add", "--prefix", prefix, REMOTE, sha, "--squash"];

  console.log(`Vendoring ${pin.repo}@${sha} -> ${prefix}`);
  git(subtreeArgs, { inherit: true });

  pin.pinnedCommit = sha;
  pin.lastVendoredAt = new Date().toISOString();
  writePin(pin);
  console.log("Updated upstream.json pin.");
}

function cmdDiff() {
  const pin = readPin();
  if (!pin.pinnedCommit) {
    console.error("No pinnedCommit yet. Run `upstream:vendor` first.");
    process.exit(1);
  }
  ensureRemote(pin.repo);
  const sha = resolveRef(pin.ref);
  if (sha === pin.pinnedCommit) {
    console.log("No upstream changes since the pinned commit.");
    return;
  }
  git(["log", "--oneline", `${pin.pinnedCommit}..${sha}`], { inherit: true });
}

const [, , cmd] = process.argv;
try {
  switch (cmd) {
    case "check":
      cmdCheck();
      break;
    case "vendor":
      cmdVendor();
      break;
    case "diff":
      cmdDiff();
      break;
    default:
      console.error("Usage: upstream.mjs <check|vendor|diff>");
      process.exit(1);
  }
} catch (err) {
  console.error(err.message ?? err);
  process.exit(1);
}

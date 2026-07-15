#!/usr/bin/env node
/**
 * Switch between install targets:
 *   node scripts/set-target.js full
 *   node scripts/set-target.js web
 *   node scripts/set-target.js web --apply   # also replace package.json
 *   node scripts/set-target.js              # print current target
 *
 * Env override (wins over artwall.config.json): ARTWALL_TARGET=web|full
 *
 * Render Static Site:
 *   SKIP_INSTALL_DEPS = true
 *   Build Command     = npm run deploy:web
 *   Publish Directory = dist
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'artwall.config.json');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const VALID = new Set(['full', 'web']);

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

function resolveTarget(cliTarget) {
  const envTarget = (process.env.ARTWALL_TARGET || '').trim().toLowerCase();
  if (envTarget) {
    if (!VALID.has(envTarget)) {
      throw new Error(`Invalid ARTWALL_TARGET="${envTarget}". Use "full" or "web".`);
    }
    return envTarget;
  }
  if (cliTarget) {
    if (!VALID.has(cliTarget)) {
      throw new Error(`Invalid target "${cliTarget}". Use "full" or "web".`);
    }
    return cliTarget;
  }
  return readConfig().target || 'full';
}

function applyPackageJson(target) {
  const source = path.join(ROOT, `package.${target}.json`);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing manifest: package.${target}.json`);
  }
  fs.copyFileSync(source, PACKAGE_PATH);
  console.log(`Copied package.${target}.json → package.json`);
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--apply');
  const apply = process.argv.includes('--apply');
  const cliTarget = args[0];

  if (!cliTarget && !process.env.ARTWALL_TARGET) {
    const config = readConfig();
    console.log(`Current target: ${config.target}`);
    console.log(`  full — ${config.targets.full}`);
    console.log(`  web  — ${config.targets.web}`);
    console.log('\nSwitch: npm run target:full | npm run target:web');
    console.log('Apply package.json + reinstall when switching locally.');
    return;
  }

  const target = resolveTarget(cliTarget);
  const config = readConfig();
  config.target = target;
  writeConfig(config);
  console.log(`ARTWALL_TARGET → ${target} (${config.targets[target]})`);

  if (apply) {
    applyPackageJson(target);
  } else if (cliTarget) {
    console.log('Config updated. To swap dependencies run:');
    console.log(`  node scripts/set-target.js ${target} --apply && npm install`);
  }
}

main();

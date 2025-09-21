#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read app.json version
const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const appVersion = appConfig.expo.version;

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update package.json version to match app.json
packageJson.version = appVersion;

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Updated package.json version to ${appVersion}`);

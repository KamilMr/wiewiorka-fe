#!/usr/bin/env node

import {networkInterfaces} from 'os';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const easJsonPath = path.join(__dirname, '..', 'eas.json');

function getLocalIP() {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  const priority = ['en0', 'wlan0', 'eth0', 'Wi-Fi', 'Ethernet'];

  for (const interfaceName of priority) {
    if (results[interfaceName] && results[interfaceName].length > 0) {
      return results[interfaceName][0];
    }
  }

  for (const interfaceName of Object.keys(results)) {
    if (results[interfaceName].length > 0) {
      return results[interfaceName][0];
    }
  }

  return '127.0.0.1';
}

function updateEasJson() {
  const ip = getLocalIP();
  const apiUrl = `http://${ip}:7555`;

  console.log(`Detected IP: ${ip}`);
  console.log(`Setting API URL in eas.json: ${apiUrl}`);

  try {
    if (!fs.existsSync(easJsonPath)) {
      console.error('eas.json not found!');
      process.exit(1);
    }

    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

    if (easConfig.build && easConfig.build.local) {
      if (!easConfig.build.local.env) {
        easConfig.build.local.env = {};
      }
      easConfig.build.local.env.EXPO_PUBLIC_API_URL = apiUrl;
    } else {
      console.error('Local build profile not found in eas.json!');
      process.exit(1);
    }

    fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2) + '\n');

    console.log(`Updated eas.json with IP: ${ip}`);
  } catch (error) {
    console.error('Error updating eas.json:', error.message);
    process.exit(1);
  }
}

updateEasJson();

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const outputPath = path.join(__dirname, "firebase-config.js");

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");
      env[key] = value;
      return env;
    }, {});
}

if (!fs.existsSync(envPath)) {
  console.error("Missing .env file. Copy .env.example to .env and add Firebase values.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const requiredKeys = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
];

const missingKeys = requiredKeys.filter((key) => !env[key]);
if (missingKeys.length) {
  console.error(`Missing required Firebase env values: ${missingKeys.join(", ")}`);
  process.exit(1);
}

const config = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID || "",
};

const output = `window.FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(outputPath, output);
console.log(`Generated ${path.relative(rootDir, outputPath)}`);

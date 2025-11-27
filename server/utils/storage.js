import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");

// Lock mechanism to prevent race conditions
const fileLocks = new Map();

const ensureDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

const acquireLock = async (fileName) => {
  const lockKey = fileName;
  while (fileLocks.has(lockKey)) {
    // Wait for lock to be released
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  fileLocks.set(lockKey, true);
  return () => {
    fileLocks.delete(lockKey);
  };
};

export const readJson = async (fileName, fallback) => {
  const filePath = path.join(dataDir, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) {
      await writeJson(fileName, fallback);
      return fallback;
    }
    throw error;
  }
};

export const writeJson = async (fileName, data) => {
  await ensureDir();
  const filePath = path.join(dataDir, fileName);
  const releaseLock = await acquireLock(fileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } finally {
    releaseLock();
  }
};


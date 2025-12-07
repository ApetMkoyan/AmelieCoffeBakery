import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// On Vercel, __dirname might be different, so we need to handle it
let dataDir = path.resolve(__dirname, "../data");
// Fallback: try to find data directory relative to process.cwd() if the relative path doesn't work
if (process.env.VERCEL) {
  // On Vercel, try multiple possible paths
  const possiblePaths = [
    path.resolve(__dirname, "../data"),
    path.resolve(process.cwd(), "server/data"),
    path.resolve(process.cwd(), "data"),
  ];
  // Use the first path that exists, or default to the first one
  dataDir = possiblePaths[0]; // We'll check existence when reading
}

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
  // Build list of possible paths to try
  const possiblePaths = process.env.VERCEL ? [
    path.resolve(__dirname, "../data", fileName),
    path.resolve(process.cwd(), "server/data", fileName),
    path.resolve(process.cwd(), "data", fileName),
    path.join(dataDir, fileName),
  ] : [path.join(dataDir, fileName)];
  
  let filePath = possiblePaths[0];
  let foundPath = null;
  
  // Try to find the file at any of the possible paths
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      foundPath = testPath;
      filePath = testPath;
      if (process.env.VERCEL) {
        console.log(`✅ Found ${fileName} at: ${testPath}`);
      }
      break;
    } catch (e) {
      // Continue to next path
    }
  }
  
  // If file not found and we have a fallback, return it
  if (!foundPath && fallback !== undefined) {
    console.log(`📝 File ${fileName} not found, using fallback`);
    console.log(`📝 Tried paths: ${possiblePaths.join(", ")}`);
    // Try to create the file with fallback, but don't fail if we can't
    try {
      await writeJson(fileName, fallback);
    } catch (writeError) {
      console.warn(`⚠️ Could not create ${fileName}, but returning fallback anyway:`, writeError.message);
    }
    return fallback;
  }
  
  // Try to read and parse the file
  try {
    const raw = await fs.readFile(filePath, "utf8");
    
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (parseError) {
      console.error(`❌ JSON parse error in ${fileName}:`, parseError.message);
      console.error(`❌ File path: ${filePath}`);
      // If JSON is invalid and we have a fallback, return it
      if (fallback !== undefined) {
        console.warn(`⚠️ Returning fallback for ${fileName} due to parse error`);
        return fallback;
      }
      throw parseError;
    }
  } catch (error) {
    // Handle all errors gracefully
    if (error.code === "ENOENT" && fallback !== undefined) {
      console.log(`📝 File ${fileName} not found, using fallback`);
      // Try to create the file, but don't fail if we can't
      try {
        await writeJson(fileName, fallback);
      } catch (writeError) {
        // Ignore write errors, just return fallback
      }
      return fallback;
    }
    
    // For any other error, if we have a fallback, return it
    if (fallback !== undefined) {
      console.warn(`⚠️ Error reading ${fileName}, returning fallback:`, error.message);
      console.warn(`⚠️ Error code: ${error.code}, path: ${filePath}`);
      return fallback;
    }
    
    // Only throw if no fallback provided
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


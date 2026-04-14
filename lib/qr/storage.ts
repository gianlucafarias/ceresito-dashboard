import { promises as fs } from "fs";
import path from "path";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const QR_DIRECTORY = "qrs";
const QR_STORAGE_ROOT = path.resolve(STORAGE_ROOT, QR_DIRECTORY);

function resolveStoragePath(storagePath: string) {
  const normalizedPath = storagePath.replace(/\\/g, "/");
  const absolutePath = path.resolve(STORAGE_ROOT, normalizedPath);

  if (
    absolutePath !== STORAGE_ROOT &&
    !absolutePath.startsWith(`${STORAGE_ROOT}${path.sep}`)
  ) {
    throw new Error("Ruta de storage invalida");
  }

  return absolutePath;
}

export const qrFileStorage = {
  async save(fileName: string, content: Buffer) {
    await fs.mkdir(QR_STORAGE_ROOT, { recursive: true });

    const storagePath = path.posix.join(QR_DIRECTORY, fileName);
    const absolutePath = resolveStoragePath(storagePath);
    await fs.writeFile(absolutePath, content);

    return storagePath;
  },

  async read(storagePath: string) {
    return fs.readFile(resolveStoragePath(storagePath));
  },

  async exists(storagePath: string) {
    try {
      await fs.access(resolveStoragePath(storagePath));
      return true;
    } catch {
      return false;
    }
  },

  async remove(storagePath: string) {
    try {
      await fs.unlink(resolveStoragePath(storagePath));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw error;
      }
    }
  },
};

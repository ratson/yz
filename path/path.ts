import { exists } from "https://deno.land/std@0.108.0/fs/exists.ts";
import {
  basename,
  isAbsolute,
  join,
  resolve,
} from "https://deno.land/std@0.108.0/path/mod.ts";
import { userHomeDir } from "../os/mod.ts";

export class Path {
  #path: string[];

  private constructor(...pathSegments: string[]) {
    this.#path = pathSegments;
  }

  static pathMap = new Map<string, WeakRef<Path>>();

  static cwd() {
    return Path.from(Deno.cwd());
  }

  static from(...pathSegments: string[]) {
    const k = resolve(...pathSegments);
    const v = this.pathMap.get(k)?.deref();
    if (v) return v;

    const p = new this(...pathSegments);
    this.pathMap.set(k, new WeakRef(p));

    this.#counter += 1;
    if (this.#counter % 128 === 0) this.#gc();

    return p;
  }

  static fromImportMeta(importMeta: ImportMeta, url = "") {
    return Path.from(new URL(url, importMeta.url).pathname);
  }

  static home() {
    return Path.from(userHomeDir()!);
  }

  static #counter = 0;

  static #gc() {
    const m = this.pathMap;
    for (const [k, v] of m.entries()) {
      if (!v.deref()) m.delete(k);
    }
  }

  get name() {
    return basename(this.toString());
  }

  exists() {
    return exists(join(...this.#path));
  }

  isAbsolute() {
    return isAbsolute(this.toString());
  }

  joinpath(...other: string[]) {
    return Path.from(join(...this.#path, ...other));
  }

  toString() {
    return resolve(...this.#path);
  }

  stat() {
    return Deno.stat(this.toString());
  }

  async isDir() {
    try {
      const stat = await this.stat();
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  async isFile() {
    try {
      const stat = await this.stat();
      return stat.isFile;
    } catch {
      return false;
    }
  }

  async isSymlink() {
    try {
      const stat = await this.stat();
      return stat.isSymlink;
    } catch {
      return false;
    }
  }
}

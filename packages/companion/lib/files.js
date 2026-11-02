// packages/companion/src/home/ids.ts
var ContractError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function token(value, code, pattern = /^[a-zA-Z0-9_-]{1,128}$/) {
  if (typeof value !== "string" || !pattern.test(value)) throw new ContractError(code);
  return value;
}
function FileTag(value) {
  return token(value, "INVALID_FILE_TAG", /^file-v1-[0-9a-f]{64}$/);
}
function FileGrantId(value) {
  return token(value, "INVALID_FILE_GRANT_ID", /^file-grant-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
}

// packages/companion/src/adapters/local-files.ts
import { constants } from "node:fs";
import { lstat, realpath, open, opendir, rename, unlink, mkdir, link, rmdir } from "node:fs/promises";
import { join, resolve, relative, sep, parse, dirname, isAbsolute } from "node:path";
import { createHash, randomUUID } from "node:crypto";

// packages/companion/src/home/file-access.ts
var fileAccessDefaults = Object.freeze({ works: "read-write", journal: "read-write", grants: Object.freeze([]) });
var exact = (value, keys) => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length && keys.every((key) => {
  const item = Object.getOwnPropertyDescriptor(value, key);
  return !!item && "value" in item;
});
function validateFileAccess(value) {
  if (!exact(value, ["works", "journal", "grants"]) || typeof value.works !== "string" || !["none", "read-only", "read-write"].includes(value.works) || typeof value.journal !== "string" || !["none", "read-only", "read-write"].includes(value.journal) || !Array.isArray(value.grants) || Object.getPrototypeOf(value.grants) !== Array.prototype || value.grants.length > 64 || Reflect.ownKeys(value.grants).length !== value.grants.length + 1) return false;
  const ids = /* @__PURE__ */ new Set();
  for (let index = 0; index < value.grants.length; index++) {
    const item = Object.getOwnPropertyDescriptor(value.grants, String(index));
    if (!item || !("value" in item) || !exact(item.value, ["grantId", "mode"]) || item.value.mode !== "read-only" && item.value.mode !== "read-write") return false;
    let id;
    try {
      id = FileGrantId(item.value.grantId);
    } catch {
      return false;
    }
    if (ids.has(id)) return false;
    ids.add(id);
  }
  return true;
}
function admitFileAccess(value) {
  return { works: value.works, journal: value.journal, grants: value.grants.map((grant) => ({ grantId: FileGrantId(grant.grantId), mode: grant.mode })) };
}

// packages/companion/src/actions/files.ts
function fileGrantScope(grantId) {
  return `grant:${grantId}`;
}
function parseScope(value) {
  if (value === "works" || value === "journal") return value;
  if (typeof value === "string" && value.startsWith("grant:")) {
    try {
      return fileGrantScope(FileGrantId(value.slice(6)));
    } catch {
    }
  }
  throw new FileActionError("INVALID_ROLE_FILE");
}
var FileActionError = class extends Error {
  constructor(code, reason) {
    super(code);
    this.code = code;
    this.reason = reason;
  }
};
var plain = (value) => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
var validUnicode = (value) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
function parseRoleFile(value) {
  if (!plain(value) || Reflect.ownKeys(value).length !== Object.keys(value).length) throw new FileActionError("INVALID_ROLE_FILE");
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) throw new FileActionError("INVALID_ROLE_FILE");
  }
  const scope = parseScope(value.scope);
  if (typeof value.path !== "string") throw new FileActionError("INVALID_ROLE_FILE");
  if (!validUnicode(value.path) || value.path.includes("\\") || value.path.includes(":") || value.path.includes("\0") || !(value.op === "list" && value.path === "") && value.path.split("/").some((part) => !part || part === "." || part === "..")) throw new FileActionError("INVALID_FILE_PATH");
  const keys = Object.keys(value).sort().join("|");
  if (value.op === "remove") {
    if (keys !== "expectedTag|op|path|recursive|scope" || typeof value.recursive !== "boolean") throw new FileActionError("INVALID_ROLE_FILE");
    return { op: "remove", scope, path: value.path, expectedTag: FileTag(value.expectedTag), recursive: value.recursive };
  }
  if (value.op === "move") {
    if (keys !== "destination|destinationExpectedTag|expectedTag|op|path|scope" || typeof value.destination !== "string" || !validUnicode(value.destination) || !value.destination || value.destination.includes("\\") || value.destination.includes(":") || value.destination.includes("\0") || value.destination.split("/").some((part) => !part || part === "." || part === "..") || value.destination === value.path || value.destination.startsWith(value.path + "/") || value.destinationExpectedTag !== "absent") throw new FileActionError("INVALID_ROLE_FILE");
    return { op: "move", scope, path: value.path, destination: value.destination, expectedTag: FileTag(value.expectedTag), destinationExpectedTag: "absent" };
  }
  if (value.op === "mkdir") {
    if (keys !== "expectedTag|op|path|scope" || value.expectedTag !== "absent") throw new FileActionError("INVALID_ROLE_FILE");
    return { op: "mkdir", scope, path: value.path, expectedTag: "absent" };
  }
  if (value.op === "writeText") {
    if (keys !== "expectedTag|op|path|scope|text" || typeof value.text !== "string" || !validUnicode(value.text)) throw new FileActionError("INVALID_ROLE_FILE");
    return { op: "writeText", scope, path: value.path, text: value.text, expectedTag: value.expectedTag === "absent" ? "absent" : FileTag(value.expectedTag) };
  }
  if (value.op !== "list" && value.op !== "readText" || !["limit|offset|op|path|scope", "expectedTag|limit|offset|op|path|scope"].includes(keys) || typeof value.offset !== "number" || !Number.isSafeInteger(value.offset) || value.offset < 0 || typeof value.limit !== "number" || !Number.isSafeInteger(value.limit) || value.limit < 1) throw new FileActionError("INVALID_ROLE_FILE");
  if (value.offset > 0 && !("expectedTag" in value)) throw new FileActionError("FILE_PAGE_TAG_REQUIRED");
  return { op: value.op, scope, path: value.path, offset: value.offset, limit: value.limit, ..."expectedTag" in value ? { expectedTag: FileTag(value.expectedTag) } : {} };
}

// packages/companion/src/adapters/local-files.ts
var within = (root, path) => {
  const r = relative(root, path);
  return r === "" || r !== ".." && !r.startsWith(".." + sep) && !isAbsolute(r);
};
var tag = (s) => FileTag("file-v1-" + createHash("sha256").update([s.dev, s.ino, s.mode, s.nlink, s.size, s.mtimeNs, s.ctimeNs].map(String).join(":")).digest("hex"));
var identity = (a, b) => a.dev === b.dev && a.ino === b.ino && tag(a) === tag(b);
async function createLocalRoleFiles(layout, environment, io = {}, areas) {
  let phase = "HOME";
  try {
    let lexicalProtection2 = function(path) {
      if (path.split(sep).some((part) => fold(part).startsWith(".role-file-"))) throw new FileActionError("PROTECTED_FILE");
      if (within(home, path)) {
        const top = relative(home, path).split(sep)[0];
        if (!top || !layout.ordinaryRelativeRoots.includes(top)) throw new FileActionError("PROTECTED_FILE");
      }
      if (protectedRoots.some((root) => within(fold(root), fold(path)) || within(fold(path), fold(root)))) throw new FileActionError("PROTECTED_FILE");
    };
    var lexicalProtection = lexicalProtection2;
    environment.check();
    const home = resolve(layout.root);
    if (await realpath(home) !== home) throw new FileActionError("UNSAFE_FILE_ROOT");
    const key = (info) => String(info.dev) + ":" + String(info.ino), fold = (path) => path.normalize("NFC").toLowerCase();
    const physical = (info) => [info.dev, info.ino, info.birthtimeNs].join(":"), currentHomeIdentity = physical(await lstat(home, { bigint: true })), protectedHomeIdentities = new Set((environment.protectedHomeIdentities ?? []).map((info) => [info.device, info.inode, info.birthtimeNs].join(":")));
    phase = "PROTECTED_PATHS";
    const protectedRoots = await Promise.all(environment.roots.map(async (path) => {
      let parent = resolve(path), suffix = [];
      while (true) {
        try {
          return join(await realpath(parent), ...suffix);
        } catch (error) {
          if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT" || dirname(parent) === parent) throw error;
          suffix.unshift(parent.slice(dirname(parent).length + 1));
          parent = dirname(parent);
        }
      }
    }));
    phase = "SCOPES";
    const claimedPermissions = areas?.permissions ?? fileAccessDefaults;
    if (!validateFileAccess(claimedPermissions)) throw new FileActionError("INVALID_FILE_ACCESS");
    const permissions = admitFileAccess(claimedPermissions);
    const roots = /* @__PURE__ */ new Map(), candidates = [];
    for (const scope of layout.ordinaryRelativeRoots) {
      if (scope !== "works" && scope !== "journal") throw new FileActionError("FILE_LAYOUT_UNSUPPORTED");
      if (permissions[scope] !== "none") candidates.push({ scope, path: join(home, scope), mode: permissions[scope], ordinary: scope });
    }
    const mapped = /* @__PURE__ */ new Set();
    for (const mapping of areas?.externalMappings ?? []) {
      const grantId = FileGrantId(mapping.grantId);
      if (mapped.has(grantId)) throw new FileActionError("INVALID_FILE_MAPPING");
      mapped.add(grantId);
      const grant = permissions.grants.find((item) => item.grantId === grantId);
      if (!grant) continue;
      const path = resolve(mapping.root);
      if (!isAbsolute(mapping.root) || mapping.root !== path || await realpath(path) !== path) throw new FileActionError("UNSAFE_FILE_ROOT");
      candidates.push({ scope: fileGrantScope(grantId), path, mode: grant.mode });
    }
    for (const candidate of candidates) {
      const { scope, path, mode, ordinary } = candidate;
      if (protectedRoots.some((root) => within(fold(root), fold(path)))) continue;
      if (ordinary) await io.initializeArea?.(ordinary);
      environment.check();
      try {
        const info = await lstat(path, { bigint: true });
        if (!info.isDirectory() || info.isSymbolicLink()) throw new FileActionError("UNSAFE_FILE_ROOT");
        roots.set(scope, { path, identity: info, mode });
      } catch (error) {
        if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
      }
    }
    phase = "PROTECTED_IDENTITIES";
    const protectedIdentities = /* @__PURE__ */ new Set(), protectedAncestors = /* @__PURE__ */ new Set();
    for (const root of protectedRoots) {
      let cursor = root, first = true;
      while (true) {
        try {
          const info = await lstat(cursor, { bigint: true });
          if (first) protectedIdentities.add(key(info));
          protectedAncestors.add(key(info));
        } catch (error) {
          if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
        }
        first = false;
        if (dirname(cursor) === cursor) break;
        cursor = dirname(cursor);
      }
    }
    async function protection(path, info, missing = false) {
      lexicalProtection2(path);
      let cursor = missing ? dirname(path) : path, first = !missing;
      while (true) {
        const current = first && info ? info : await lstat(cursor, { bigint: true });
        const homeKey = physical(current), ordinaryOwnPath = homeKey === currentHomeIdentity && within(home, path) && layout.ordinaryRelativeRoots.includes(relative(home, path).split(sep)[0]);
        if (protectedHomeIdentities.has(homeKey) && !ordinaryOwnPath || protectedIdentities.has(key(current)) || first && current.isDirectory() && protectedAncestors.has(key(current))) throw new FileActionError("PROTECTED_FILE");
        first = false;
        if (dirname(cursor) === cursor) break;
        cursor = dirname(cursor);
      }
    }
    async function checked(request) {
      await environment.refresh?.();
      parseRoleFile(request);
      environment.check();
      const root = roots.get(request.scope);
      if (!root) throw new FileActionError("FILE_SCOPE_UNAVAILABLE");
      const path = join(root.path, request.path);
      if (!within(root.path, path)) throw new FileActionError("INVALID_FILE_PATH");
      lexicalProtection2(path);
      const ordinary = within(home, path) ? relative(home, path).split(sep)[0] : void 0, ordinaryMode = ordinary === "works" || ordinary === "journal" ? permissions[ordinary] : void 0;
      if (ordinaryMode === "none") throw new FileActionError("FILE_SCOPE_UNAVAILABLE");
      if (request.op !== "list" && request.op !== "readText" && (root.mode === "read-only" || ordinaryMode === "read-only")) throw new FileActionError("FILE_READ_ONLY");
      let info;
      try {
        info = await lstat(path, { bigint: true });
      } catch (error) {
        if (request.op !== "writeText" && request.op !== "mkdir" || !error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
      }
      await protection(path, info, !info);
      let cursor = parse(path).root;
      for (const part of path.slice(cursor.length).split(sep)) {
        cursor = join(cursor, part);
        if (cursor === path && !info) break;
        const current = await lstat(cursor, { bigint: true });
        if (current.isSymbolicLink() || !current.isDirectory() && current.nlink !== 1n) throw new FileActionError("UNSAFE_FILE_LINK");
      }
      const currentRoot = await lstat(root.path, { bigint: true });
      if (currentRoot.dev !== root.identity.dev || currentRoot.ino !== root.identity.ino) throw new FileActionError("STALE_FILE_SCOPE");
      return { root, path, info };
    }
    async function tree(request, rules, signal) {
      const entries = [], seen = /* @__PURE__ */ new Set();
      let discovered = 0;
      const visit = async (path) => {
        if (signal?.aborted) throw new FileActionError("FILE_OPERATION_CANCELLED");
        const current = await checked({ ...request, path });
        if (!current.info || !current.info.isDirectory() && !current.info.isFile()) throw new FileActionError("UNSAFE_FILE_ENTRY");
        if (entries.length > rules.recursiveEntries) throw new FileActionError("DIRECTORY_TOO_LARGE");
        const key2 = String(current.info.dev) + ":" + String(current.info.ino);
        if (seen.has(key2)) throw new FileActionError("UNSAFE_FILE_ALIAS");
        seen.add(key2);
        entries.push({ path, info: current.info });
        if (current.info.isDirectory()) {
          const names = [], directory = await opendir(current.path);
          try {
            for await (const entry of directory) {
              if (signal?.aborted) throw new FileActionError("FILE_OPERATION_CANCELLED");
              if (discovered >= rules.recursiveEntries) throw new FileActionError("DIRECTORY_TOO_LARGE");
              discovered++;
              names.push(entry.name);
            }
          } finally {
            await directory.close().catch((error) => {
              if (error.code !== "ERR_DIR_CLOSED") throw error;
            });
          }
          names.sort();
          for (const name of names) await visit(path + "/" + name);
        }
      };
      await visit(request.path);
      if (entries.length - 1 > rules.recursiveEntries) throw new FileActionError("DIRECTORY_TOO_LARGE");
      return entries;
    }
    const sameTree = (before, after) => before.length === after.length && before.every((entry, index) => entry.path === after[index]?.path && identity(entry.info, after[index].info));
    const safe = (error) => {
      if (error instanceof FileActionError) return error;
      const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
      return new FileActionError(code === "ENOENT" ? "FILE_NOT_FOUND" : code === "EACCES" || code === "EPERM" ? "FILE_ACCESS_DENIED" : "FILE_IO_FAILED");
    };
    phase = "READY";
    return Object.freeze({ scopes: Object.freeze([...roots.keys()]), assertCurrent() {
      environment.check();
    }, async check(request) {
      try {
        await checked(request);
      } catch (error) {
        throw safe(error);
      }
    }, async execute(request, rules, signal) {
      try {
        const cancel = () => {
          if (signal?.aborted) throw new FileActionError("FILE_OPERATION_CANCELLED");
        };
        cancel();
        const selected = await checked(request);
        if (request.op === "remove") {
          if (!selected.info || tag(selected.info) !== request.expectedTag) throw new FileActionError("CONTENT_CHANGED");
          if (selected.info.isDirectory()) {
            let handle3, attempted2 = false;
            const stages2 = [];
            try {
              try {
                handle3 = await open(selected.path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                if (!identity(selected.info, await handle3.stat({ bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
                const manifest = await tree(request, rules, signal);
                if (!request.recursive && manifest.length !== 1) throw new FileActionError("DIRECTORY_NOT_EMPTY");
                await io.barrier?.("before-file-entry");
                cancel();
                if (!sameTree(manifest, await tree(request, rules, signal)) || !identity(selected.info, await handle3.stat({ bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
                for (const entry of [...manifest].reverse()) {
                  cancel();
                  const current = await checked({ ...request, path: entry.path });
                  if (!current.info || current.info.dev !== entry.info.dev || current.info.ino !== entry.info.ino || current.info.isDirectory() !== entry.info.isDirectory() || !entry.info.isDirectory() && !identity(entry.info, current.info)) throw new FileActionError("CONTENT_CHANGED");
                  const parent2 = dirname(current.path), directory2 = await open(parent2, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                  try {
                    const pinned = await directory2.stat({ bigint: true }), live = await lstat(parent2, { bigint: true });
                    if (pinned.dev !== live.dev || pinned.ino !== live.ino) throw new FileActionError("CONTENT_CHANGED");
                    cancel();
                    environment.check();
                    io.entered?.("remove", request.scope, entry.path);
                    attempted2 = true;
                    if (entry.info.isDirectory()) await rmdir(current.path);
                    else await unlink(current.path);
                    stages2.push("removed:" + entry.path);
                    await io.barrier?.("after-file-remove-entry");
                    await directory2.sync();
                  } finally {
                    await directory2.close();
                  }
                }
                await io.barrier?.("after-file-publish");
                const final = await handle3.stat({ bigint: true });
                if (final.dev !== selected.info.dev || final.ino !== selected.info.ino) throw new FileActionError("CONTENT_CHANGED");
                try {
                  await lstat(selected.path);
                  throw new FileActionError("CONTENT_CHANGED");
                } catch (error) {
                  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
                }
                return { op: "remove", scope: request.scope, path: request.path, effect: "published", previousTag: request.expectedTag, stages: stages2 };
              } finally {
                await handle3?.close();
              }
            } catch (error) {
              if (attempted2) return { op: "remove", scope: request.scope, path: request.path, effect: "unknown", previousTag: request.expectedTag, stages: stages2, code: safe(error).code };
              throw error;
            }
          }
          if (!selected.info.isFile()) throw new FileActionError("UNSAFE_FILE_ENTRY");
          const parent = dirname(selected.path);
          let handle2, directory, attempted = false;
          const stages = [];
          try {
            try {
              directory = await open(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
              const pinnedParent = await directory.stat({ bigint: true });
              handle2 = await open(selected.path, constants.O_RDONLY | constants.O_NOFOLLOW);
              await io.barrier?.("before-file-entry");
              cancel();
              const latest2 = await checked(request), currentParent = await lstat(parent, { bigint: true });
              if (!latest2.info || tag(latest2.info) !== request.expectedTag || !identity(selected.info, await handle2.stat({ bigint: true })) || currentParent.dev !== pinnedParent.dev || currentParent.ino !== pinnedParent.ino) throw new FileActionError("CONTENT_CHANGED");
              io.entered?.("remove", request.scope, request.path);
              attempted = true;
              await unlink(selected.path);
              stages.push("entry-removed");
              await io.barrier?.("after-file-publish");
              if ((await handle2.stat({ bigint: true })).nlink !== 0n) throw new FileActionError("CONTENT_CHANGED");
              try {
                await lstat(selected.path);
                throw new FileActionError("CONTENT_CHANGED");
              } catch (error) {
                if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
              }
              const finalParent = await lstat(parent, { bigint: true });
              if (finalParent.dev !== pinnedParent.dev || finalParent.ino !== pinnedParent.ino) throw new FileActionError("CONTENT_CHANGED");
              await directory.sync();
              return { op: "remove", scope: request.scope, path: request.path, effect: "published", previousTag: request.expectedTag, stages };
            } finally {
              const closed = await Promise.allSettled([handle2?.close(), directory?.close()]);
              for (const result of closed) if (result.status === "rejected") throw result.reason;
            }
          } catch (error) {
            if (attempted) return { op: "remove", scope: request.scope, path: request.path, effect: "unknown", previousTag: request.expectedTag, stages, code: safe(error).code };
            throw error;
          }
        }
        if (request.op === "move") {
          if (!selected.info || tag(selected.info) !== request.expectedTag) throw new FileActionError("CONTENT_CHANGED");
          const targetRequest = { op: "mkdir", scope: request.scope, path: request.destination, expectedTag: "absent" };
          const destination = await checked(targetRequest);
          if (destination.info) throw new FileActionError("CONTENT_CHANGED");
          if (selected.info.isDirectory()) {
            if (within(selected.path, destination.path)) throw new FileActionError("INVALID_FILE_DESTINATION");
            const sourceTree = { op: "remove", scope: request.scope, path: request.path, expectedTag: request.expectedTag, recursive: true };
            const sourceParent2 = dirname(selected.path), targetParent2 = dirname(destination.path);
            let sourceDirectory2, targetDirectory2, handle3, reservation, reserved = false;
            const stages2 = [];
            try {
              try {
                sourceDirectory2 = await open(sourceParent2, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                targetDirectory2 = await open(targetParent2, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                handle3 = await open(selected.path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                const sourceParentInfo = await sourceDirectory2.stat({ bigint: true }), targetParentInfo = await targetDirectory2.stat({ bigint: true }), manifest = await tree(sourceTree, rules, signal);
                const parents = async () => {
                  const source = await lstat(sourceParent2, { bigint: true }), target = await lstat(targetParent2, { bigint: true });
                  if (source.dev !== sourceParentInfo.dev || source.ino !== sourceParentInfo.ino || target.dev !== targetParentInfo.dev || target.ino !== targetParentInfo.ino) throw new FileActionError("CONTENT_CHANGED");
                };
                await io.barrier?.("before-file-entry");
                cancel();
                if (!sameTree(manifest, await tree(sourceTree, rules, signal)) || !identity(selected.info, await handle3.stat({ bigint: true })) || (await checked(targetRequest)).info) throw new FileActionError("CONTENT_CHANGED");
                await parents();
                try {
                  await mkdir(destination.path, { mode: 448 });
                } catch (error) {
                  if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") throw new FileActionError("CONTENT_CHANGED");
                  throw error;
                }
                reserved = true;
                stages2.push("destination-reserved");
                io.entered?.("move", request.scope, request.path);
                reservation = await open(destination.path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
                const reservedInfo = await reservation.stat({ bigint: true });
                if (!identity(reservedInfo, await lstat(destination.path, { bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
                await io.barrier?.("after-file-move-reserve");
                cancel();
                environment.check();
                await parents();
                if (!sameTree(manifest, await tree(sourceTree, rules, signal)) || !identity(reservedInfo, (await checked(targetRequest)).info)) throw new FileActionError("CONTENT_CHANGED");
                await rename(selected.path, destination.path);
                stages2.push("source-renamed");
                await io.barrier?.("after-file-publish");
                const final = await handle3.stat({ bigint: true }), live = await lstat(destination.path, { bigint: true });
                if (final.dev !== selected.info.dev || final.ino !== selected.info.ino || !identity(final, live)) throw new FileActionError("CONTENT_CHANGED");
                try {
                  await lstat(selected.path);
                  throw new FileActionError("CONTENT_CHANGED");
                } catch (error) {
                  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
                }
                const after = await tree({ ...sourceTree, path: request.destination }, rules, signal);
                if (after.length !== manifest.length || manifest.some((entry, index) => {
                  const next = after[index];
                  return !next || relative(request.path, entry.path) !== relative(request.destination, next.path) || entry.info.dev !== next.info.dev || entry.info.ino !== next.info.ino || index !== 0 && !identity(entry.info, next.info);
                })) throw new FileActionError("CONTENT_CHANGED");
                await parents();
                await sourceDirectory2.sync();
                await targetDirectory2.sync();
                return { op: "move", scope: request.scope, path: request.path, destination: request.destination, effect: "published", previousTag: request.expectedTag, destinationPreviousTag: "absent", stages: stages2, tag: tag(final) };
              } finally {
                const closed = await Promise.allSettled([handle3?.close(), reservation?.close(), sourceDirectory2?.close(), targetDirectory2?.close()]);
                for (const result of closed) if (result.status === "rejected") throw result.reason;
              }
            } catch (error) {
              if (reserved) return { op: "move", scope: request.scope, path: request.path, destination: request.destination, effect: "unknown", previousTag: request.expectedTag, destinationPreviousTag: "absent", stages: stages2, code: safe(error).code };
              throw error;
            }
          }
          if (!selected.info.isFile()) throw new FileActionError("UNSAFE_FILE_ENTRY");
          const sourceParent = dirname(selected.path), targetParent = dirname(destination.path);
          let sourceDirectory, targetDirectory, handle2, linked = false;
          const stages = [];
          try {
            try {
              sourceDirectory = await open(sourceParent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
              targetDirectory = await open(targetParent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
              const sourceParentInfo = await sourceDirectory.stat({ bigint: true }), targetParentInfo = await targetDirectory.stat({ bigint: true });
              handle2 = await open(selected.path, constants.O_RDONLY | constants.O_NOFOLLOW);
              const parents = async () => {
                const source = await lstat(sourceParent, { bigint: true }), target = await lstat(targetParent, { bigint: true });
                if (source.dev !== sourceParentInfo.dev || source.ino !== sourceParentInfo.ino || target.dev !== targetParentInfo.dev || target.ino !== targetParentInfo.ino) throw new FileActionError("CONTENT_CHANGED");
              };
              await io.barrier?.("before-file-entry");
              cancel();
              const latest2 = await checked(request);
              if (!latest2.info || tag(latest2.info) !== request.expectedTag || !identity(selected.info, await handle2.stat({ bigint: true })) || (await checked(targetRequest)).info) throw new FileActionError("CONTENT_CHANGED");
              await parents();
              try {
                await link(selected.path, destination.path);
              } catch (error) {
                if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") throw new FileActionError("CONTENT_CHANGED");
                throw error;
              }
              linked = true;
              stages.push("destination-linked");
              io.entered?.("move", request.scope, request.path);
              const linkedInfo = await handle2.stat({ bigint: true });
              await io.barrier?.("after-file-link");
              cancel();
              environment.check();
              await parents();
              if (linkedInfo.nlink !== 2n || !identity(linkedInfo, await lstat(selected.path, { bigint: true })) || !identity(linkedInfo, await lstat(destination.path, { bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
              await unlink(selected.path);
              stages.push("source-unlinked");
              await io.barrier?.("after-file-publish");
              const final = await handle2.stat({ bigint: true });
              if (final.nlink !== 1n || !identity(final, await lstat(destination.path, { bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
              try {
                await lstat(selected.path);
                throw new FileActionError("CONTENT_CHANGED");
              } catch (error) {
                if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
              }
              await sourceDirectory.sync();
              await targetDirectory.sync();
              return { op: "move", scope: request.scope, path: request.path, destination: request.destination, effect: "published", previousTag: request.expectedTag, destinationPreviousTag: "absent", stages, tag: tag(final) };
            } finally {
              const closed = await Promise.allSettled([handle2?.close(), sourceDirectory?.close(), targetDirectory?.close()]);
              for (const result of closed) if (result.status === "rejected") throw result.reason;
            }
          } catch (error) {
            if (linked) return { op: "move", scope: request.scope, path: request.path, destination: request.destination, effect: "unknown", previousTag: request.expectedTag, destinationPreviousTag: "absent", stages, code: safe(error).code };
            throw error;
          }
        }
        if (request.op === "mkdir") {
          if (selected.info) throw new FileActionError("CONTENT_CHANGED");
          const parent = dirname(selected.path), directory = await open(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
          const pinnedParent = await directory.stat({ bigint: true });
          let created = false;
          try {
            await io.barrier?.("before-file-entry");
            cancel();
            if ((await checked(request)).info) throw new FileActionError("CONTENT_CHANGED");
            const currentParent = await lstat(parent, { bigint: true });
            if (currentParent.dev !== pinnedParent.dev || currentParent.ino !== pinnedParent.ino) throw new FileActionError("CONTENT_CHANGED");
            try {
              await mkdir(selected.path, { mode: 448 });
            } catch (error) {
              if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") throw new FileActionError("CONTENT_CHANGED");
              throw error;
            }
            created = true;
            const createdInfo = await lstat(selected.path, { bigint: true });
            if (!createdInfo.isDirectory() || createdInfo.isSymbolicLink()) throw new FileActionError("CONTENT_CHANGED");
            io.entered?.("mkdir", request.scope, request.path);
            await io.barrier?.("after-file-publish");
            const info = await lstat(selected.path, { bigint: true });
            if (!identity(createdInfo, info) || !info.isDirectory() || info.isSymbolicLink()) throw new FileActionError("CONTENT_CHANGED");
            const finalParent = await lstat(parent, { bigint: true });
            if (finalParent.dev !== pinnedParent.dev || finalParent.ino !== pinnedParent.ino) throw new FileActionError("CONTENT_CHANGED");
            await directory.sync();
            return { op: "mkdir", scope: request.scope, path: request.path, effect: "published", previousTag: "absent", tag: tag(info) };
          } catch (error) {
            if (created) return { op: "mkdir", scope: request.scope, path: request.path, effect: "unknown", previousTag: "absent", code: safe(error).code };
            throw error;
          } finally {
            await directory.close();
          }
        }
        if (request.op === "writeText") {
          const bytes = Buffer.byteLength(request.text, "utf8");
          if (bytes > rules.maxTextBytes) throw new FileActionError("FILE_TEXT_LIMIT");
          const expect = (info) => {
            if (request.expectedTag === "absent" ? info !== void 0 : !info || !info.isFile() || tag(info) !== request.expectedTag) throw new FileActionError("CONTENT_CHANGED");
          };
          expect(selected.info);
          const parent = dirname(selected.path), beforeParent = await lstat(parent, { bigint: true }), temporary = join(parent, ".role-file-write-" + randomUUID() + ".tmp");
          let temporaryCreated = false, published = false;
          const digest = createHash("sha256").update(request.text, "utf8").digest("hex");
          try {
            await io.barrier?.("before-file-entry");
            cancel();
            expect((await checked(request)).info);
            const handle2 = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
            temporaryCreated = true;
            try {
              io.entered?.("writeText", request.scope, request.path);
              await handle2.writeFile(request.text, "utf8");
              await handle2.sync();
              await io.barrier?.("before-file-publish");
              cancel();
              const latest2 = await checked(request);
              expect(latest2.info);
              const latestParent = await lstat(parent, { bigint: true });
              if (!latestParent.isDirectory() || beforeParent.dev !== latestParent.dev || beforeParent.ino !== latestParent.ino) throw new FileActionError("CONTENT_CHANGED");
              await rename(temporary, selected.path);
              published = true;
              await io.barrier?.("after-file-publish");
              const current = await lstat(selected.path, { bigint: true }), opened = await handle2.stat({ bigint: true });
              if (!identity(current, opened) || !current.isFile() || current.nlink !== 1n) throw new FileActionError("CONTENT_CHANGED");
              const directory = await open(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
              try {
                await directory.sync();
              } finally {
                await directory.close();
              }
              return { op: "writeText", scope: request.scope, path: request.path, effect: "published", previousTag: request.expectedTag, tag: tag(current), bytes, digest };
            } finally {
              await handle2.close();
            }
          } catch (error) {
            if (temporaryCreated && !published) {
              try {
                await unlink(temporary);
                temporaryCreated = false;
              } catch {
              }
            }
            if (published || temporaryCreated) return { op: "writeText", scope: request.scope, path: request.path, effect: "unknown", previousTag: request.expectedTag, bytes, digest, code: safe(error).code };
            throw error;
          }
        }
        if (request.op === "list" && request.limit > rules.listPageSize) throw new FileActionError("FILE_PAGE_LIMIT");
        if (!selected.info || (request.op === "list" ? !selected.info.isDirectory() : !selected.info.isFile())) throw new FileActionError(request.op === "list" ? "FILE_NOT_DIRECTORY" : "FILE_NOT_TEXT_FILE");
        if (request.expectedTag && request.expectedTag !== tag(selected.info)) throw new FileActionError("CONTENT_CHANGED");
        await io.barrier?.("before-file-entry");
        cancel();
        const latest = await checked(request);
        if (!latest.info || !identity(selected.info, latest.info)) throw new FileActionError("CONTENT_CHANGED");
        if (request.op === "readText") {
          if (selected.info.size > BigInt(rules.maxTextBytes)) throw new FileActionError("FILE_TEXT_LIMIT");
          const handle2 = await open(selected.path, constants.O_RDONLY | constants.O_NOFOLLOW);
          try {
            if (!identity(selected.info, await handle2.stat({ bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
            io.entered?.("readText", request.scope, request.path);
            const chunks = [];
            let bytes = 0;
            const buffer = Buffer.alloc(Math.min(rules.maxTextBytes + 1, 65536));
            while (bytes <= rules.maxTextBytes) {
              cancel();
              const read = await handle2.read(buffer, 0, Math.min(buffer.length, rules.maxTextBytes + 1 - bytes), bytes);
              if (!read.bytesRead) break;
              chunks.push(Buffer.from(buffer.subarray(0, read.bytesRead)));
              bytes += read.bytesRead;
            }
            if (bytes > rules.maxTextBytes) throw new FileActionError("FILE_TEXT_LIMIT");
            environment.check();
            cancel();
            if (!identity(selected.info, await handle2.stat({ bigint: true })) || !identity(selected.info, (await checked(request)).info)) throw new FileActionError("CONTENT_CHANGED");
            let text;
            try {
              text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, bytes));
            } catch {
              throw new FileActionError("FILE_NOT_UTF8_TEXT");
            }
            const points = Array.from(text);
            return { op: "readText", scope: request.scope, path: request.path, text: points.slice(request.offset, request.offset + request.limit).join(""), bytes, tag: tag(selected.info), offset: request.offset, totalCodePoints: points.length, more: request.offset + request.limit < points.length };
          } finally {
            await handle2.close();
          }
        }
        const handle = await open(selected.path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
        try {
          if (!identity(selected.info, await handle.stat({ bigint: true }))) throw new FileActionError("CONTENT_CHANGED");
          io.entered?.("list", request.scope, request.path);
          const children = [];
          const directory = await opendir(selected.path);
          try {
            for await (const entry of directory) {
              cancel();
              if (children.length >= rules.recursiveEntries) throw new FileActionError("DIRECTORY_TOO_LARGE");
              const path = join(selected.path, entry.name);
              await protection(path);
              const info = await lstat(path, { bigint: true });
              if (info.isSymbolicLink() || !info.isDirectory() && info.nlink !== 1n || !info.isDirectory() && !info.isFile()) throw new FileActionError("UNSAFE_FILE_LINK");
              children.push({ name: entry.name, kind: info.isDirectory() ? "directory" : "file", tag: tag(info) });
            }
          } finally {
            await directory.close().catch((error) => {
              if (error.code !== "ERR_DIR_CLOSED") throw error;
            });
          }
          environment.check();
          cancel();
          if (!identity(selected.info, await handle.stat({ bigint: true })) || !identity(selected.info, (await checked(request)).info)) throw new FileActionError("CONTENT_CHANGED");
          children.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
          return { op: "list", scope: request.scope, path: request.path, entries: children.slice(request.offset, request.offset + request.limit), tag: tag(selected.info), offset: request.offset, totalEntries: children.length, more: request.offset + request.limit < children.length };
        } finally {
          await handle.close();
        }
      } catch (error) {
        throw safe(error);
      }
    } });
  } catch (error) {
    if (error instanceof FileActionError) throw error;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code) ? error.code : "UNKNOWN";
    throw new FileActionError("FILE_PROTECTION_UNPROVEN", "ROOT_" + phase + "_" + code);
  }
}
export {
  createLocalRoleFiles
};

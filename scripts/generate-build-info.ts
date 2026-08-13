/**
 * RETIRED — 2026-08-13
 *
 * This script formerly generated src/lib/build-info.json at build time by
 * hardcoding a STATIC_CHANGELOG array and writing Git SHA + timestamp into a
 * committed JSON file.
 *
 * It has been superseded by the new architecture:
 *
 *   • Build metadata (SHA, timestamp, version) is now baked into the JS
 *     bundle by next.config.ts using the `env:` field.  No JSON file is
 *     written or committed.
 *
 *   • The human-written changelog has been moved to src/lib/changelog.ts
 *     as a typed TypeScript const array.
 *
 *   • src/lib/build-info.ts reads exclusively from process.env.*
 *
 *   • src/lib/build-info.json is gitignored and should not be committed.
 *
 * This file is intentionally kept empty so that any stale reference to it
 * in tooling does not cause an import error.  It can be deleted once it is
 * confirmed that no external tooling references it.
 */

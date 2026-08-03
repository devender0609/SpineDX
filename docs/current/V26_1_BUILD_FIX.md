# v26.1 build consistency fix

This release fixes a mixed-version copy failure observed when Robocopy skipped source files whose timestamps were older than files already present in the permanent repository.

Changes:
- Confirms `createBlankAdjudication` is exported by `lib/caseFactory.ts`.
- Uses type-only imports for TypeScript-only symbols.
- Replaces repeated adjudication state callbacks with a typed `updateAdjudication` helper.
- Removes the invalid zero-byte package-lock file; `npm install` regenerates a synchronized lockfile.
- Adds an installation script that copies all source files with `/IS /IT`, preventing a mixed v25/v26 tree.

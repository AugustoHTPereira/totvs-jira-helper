# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TOTVS Jira Helper is a Chrome Manifest V3 content-script extension (no build step, no package manager, no bundler). It injects a helper panel into the Jira Server "Development" status widget on TOTVS's internal Jira instance, generating branch names, check-in messages, client comments, and PR templates from issue data.

- `manifest.json` — MV3 manifest; content script matches only `https://jiraproducao.totvs.com.br/browse/*`, `run_at: document_idle`.
- `content.js` — the entire extension logic.
- `styles.css` — styling injected alongside the content script; matches Jira's Atlassian AUI palette.
- `privacy.html` — privacy policy page (for Chrome Web Store listing).
- `readme.md` — Portuguese-language feature documentation (functionality matrix, architecture notes).

There is no test suite, linter, or build/package command in this repo — verification is manual, by loading the unpacked extension in Chrome (`chrome://extensions` → Load unpacked) and navigating to a sub-task issue on the TOTVS Jira instance.

## Architecture

`content.js` fetches issue data directly from the Jira REST API (`/rest/api/2/issue/:key?fields=summary,issuetype,parent`) using the developer's existing browser session cookies — no auth tokens involved. Since v3.0 it no longer scrapes the visual DOM for issue data (only for the injection anchor point).

Key behaviors to preserve when modifying `content.js`:

- **Scope filter**: the helper only renders for sub-tasks (issues with a `parent`). If the current issue has no parent (i.e. it's a top-level Task/Story), any existing helper is removed and nothing is built.
- **SPA navigation handling**: Jira Server is a single-page app using `pushState`, so the URL doesn't reload the page. The script polls `window.location.href` every 400ms (`setInterval`) and also runs a `MutationObserver` on `document.body` to re-inject the panel into `#devstatus-container` if it disappears and reappears (e.g. after a tab switch inside Jira's UI).
- **Async race protection**: `currentIssueKey` plus a `data-totvs-loading` attribute on the container guard against overlapping fetches when the user navigates quickly between issues — always check/set these when touching the fetch flow.
- **Commit-type decision matrix** (`getAutoCommitType`): derives a default check-in prefix (`FIX`, `FEAT`, `MERGE`) from the sub-task's `issuetype.name` crossed with the parent's `issuetype.name`. String matching is case-insensitive and substring-based against Portuguese terms (e.g. `"DEFEITO"`, `"CODIFICAÇÃO"`, `"HISTÓRIA"`, `"DÉBITO TÉCNICO"`) — both accented and unaccented variants must be checked since Jira data isn't guaranteed to be normalized. Falls back to `FIX` for anything unmatched. The user can override the detected type via the `#totvs-global-type` `<select>`, which re-renders all generated templates on change.
- **Generated templates** are declared as a `templates` array of `{ label, id, generate(type), isMultiline }` objects rendered into `<li>` elements; each is click-to-copy via `navigator.clipboard.writeText` with a transient green success flash on the preview box. When adding a new generated artifact, add an entry to this array rather than hand-rolling new DOM/copy logic.
- Task title (`taskName`) has known noisy prefixes stripped via regex (a leading `"Codificação - #xxx:"` pattern and a leading duplicate of the sub-task key).

## Versioning

`manifest.json`'s `version` field is bumped manually per release; keep it in sync with any functional change intended for the Chrome Web Store listing.

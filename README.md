# Reader Launcher

Public Node 24 npm-compatible package for starting a private Course Reader installation,
synchronizing its browser assets, and downloading verified private GitHub release packages.
This repository has no app source or credentials. It is distributed through GitHub
Releases; publishing to npmjs.com is not required.

Consumers install a pinned release tarball URL as `@ckurdu/reader-launcher`, and a
private Course Reader archive as a local file dependency. `package-lock.json` records
integrity. Commands:

```text
reader-launcher start
reader-launcher sync-assets
reader-launcher download 1.1.0 EXPECTED_SHA256 vendor
reader-launcher install 1.1.0 EXPECTED_SHA256 vendor
```

`download` and `install` require `READER_GITHUB_TOKEN` in the server/CI environment.
Use a fine-grained GitHub token limited to Contents: read on `ckurdu/course-reader`.
Never put it in a URL, browser script, package.json, or committed .env file.
The installer downloads the fixed repository's release asset, verifies the pinned
SHA-256 before writing, and installs with lifecycle scripts disabled.
GitHub credentials are not forwarded to the signed asset download host.

The websites use a credential-free Hostinger path instead: GitHub Actions checks out
the private app with a read-only deploy key and commits the verified npm archive into
the private website repository. Hostinger installs it locally during `npm ci`.

`releases.json` contains public version/checksum metadata only. It permits server-side
update checks without exposing private repository credentials. An update button opens
GitHub's workflow page; an authorized maintainer selects a version and runs it.

The app's browser code is necessarily delivered to authenticated readers. Private GitHub
hosting is not a mechanism for hiding JavaScript that runs in their browsers.

## Database storage

When the environment sets `DATABASE_URL` (MySQL), `start` passes a MySQL-backed
store to the app; otherwise it keeps the JSON file store. Create one database per
website and keep credentials in hosting environment variables only.

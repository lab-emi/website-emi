# Website updates

The user has given standing authorization to push and publish requested website changes. Unless the user explicitly asks for a local-only change or draft, complete each website update by:

1. Running the build and validation checks documented in `README.md` for both supported base paths.
2. Committing and pushing the changes to `main`.
3. Running the `Publish to GitHub Pages` workflow in `.github/workflows/deploy.yml` on `main` with `use_custom_domain` set to `true`.
4. Waiting for deployment to succeed and verifying the requested changes on `https://www.tudemi.com/`.

Do not ask for separate push or publication approval for these requested updates. If publishing fails, report the actual blocker and whether the changes were pushed or published.

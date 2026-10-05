From the ZX Online project root:

```sh
npm ci
node website/scripts/build-website.mjs
```

After building, serve the site locally:

```sh
node website/scripts/serve-website.mjs
```

Then open:

```text
http://localhost:4174/slides.html
```

The exercise iframes load the editor from a relative URL, for example:

```text
zx-canvas/index.html?embed=1&lesson=spider-fusion
```

## GitHub Pages

The `Build and deploy website` workflow builds the current website and embedded
editor on pull requests and pushes to `main`. Only `main` deploys. After the
one-time setup below, updates to `main` publish automatically.

An administrator or maintainer must first open the repository's
[Pages settings](https://github.com/zxcalc/zxonline/settings/pages) and select
**GitHub Actions** under **Build and deployment → Source**. If environment
protection rules are configured, allow `main` to deploy to `github-pages`.
Then merge the workflow into `main`, or run it manually from the Actions tab.

The default project URLs are:

- Overview: <https://zxcalc.github.io/zxonline/>
- Lessons: <https://zxcalc.github.io/zxonline/slides.html>

The published artifact is `website/`, including the generated `zx-canvas/`
directory. The existing build uses `--base ./`, so the editor and website assets
resolve beneath `/zxonline/`. The repository root and `dist/` contain the
standalone editor rather than the teaching website.

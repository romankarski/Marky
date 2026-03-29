# Marky

Marky is a local-first markdown workspace for browsing, searching, and editing a notes directory in the browser.

## Install

### Local repo workflow

```bash
npm install
npm run build
node server/dist/cli.js --no-open /path/to/notes
```

### Packed artifact workflow

After a tagged release publishes `marky-<version>.tgz`:

```bash
npm install -g ./marky-0.1.0.tgz
cd /path/to/notes
marky
```

### Homebrew workflow

After the Homebrew tap is published:

```bash
brew tap romankarski/marky
brew install marky
cd /path/to/notes
marky
```

## CLI Usage

Supported commands:

```bash
marky
marky .
marky /path/to/folder
marky --port 4310
marky --no-open
```

Resolution rules:

- `ROOT_DIR` overrides everything when set
- otherwise the first positional path is used
- otherwise Marky uses the current working directory

Port rules:

- `marky --port 4310` uses that exact port or exits with a clear error if it is busy
- plain `marky` probes `4310..4320` and uses the first free port

Browser behavior:

- browser auto-open is enabled by default
- `marky --no-open` disables it

## Release Notes

Tagged releases run the GitHub Actions workflow in [release-cli.yml](/Users/romankarski/Documents/Documents_v2/Projects/Marky/.github/workflows/release-cli.yml), build the package, create `marky-<version>.tgz`, and upload the tarball plus SHA256 file to the GitHub release.

# catapultjs/deploy-action

GitHub Action to run [`@catapultjs/deploy`](https://www.npmjs.com/package/@catapultjs/deploy) inside a workflow.

## What it does

The action executes CatapultJS deployment commands with a package manager resolved from the repository lockfile:

- `package-lock.json` -> `npx`
- `pnpm-lock.yaml` -> `pnpx`
- `yarn.lock` -> `yarn dlx`
- `bun.lock` / `bun.lockb` -> `bunx`

## Usage

Use the minimal workflow when the project dependencies can be installed with the runner defaults:

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: catapultjs/deploy-action@v1
        with:
          command: deploy
          config: catapult.deploy.ts
          private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
          known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          version: latest
```

Add a runtime setup when your project needs a specific Node version or package-manager tooling. The action always installs dependencies in the `working-directory` before running Catapult:

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - uses: catapultjs/deploy-action@v1
        with:
          command: deploy
          config: catapult.deploy.ts
          private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
          known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          version: latest
          working-directory: .
          args: |
            -vvv
            -c config.ts
```

The action installs dependencies with the detected package manager:

- npm -> `npm ci`
- pnpm -> `pnpm install --frozen-lockfile`
- yarn -> `yarn install --immutable`
- bun -> `bun install --frozen-lockfile`

You can still set up the runtime yourself before the action, for example with `actions/setup-node`, `pnpm/action-setup`, or Bun setup if your project needs a specific toolchain version.

The action prepares `~/.ssh` before running Catapult. Provide the deployment key and host verification data in the workflow:

```yaml
- uses: catapultjs/deploy-action@v1
  with:
    command: deploy
    private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
    known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
    ssh-config: |
      Host github.com
        User git
        IdentityAgent ${{ env.SSH_AUTH_SOCK }}
```

## Inputs

| Name                       | Required | Default       | Description                                                                          |
| -------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------ |
| `command`                  | No       | `deploy`      | Catapult command to run.                                                             |
| `config`                   | No       | -             | Path to the deploy config file.                                                      |
| `args`                     | No       | -             | Extra CLI args passed to Catapult, one per line.                                     |
| `package-manager`          | No       | auto-detected | Package manager to use (`npm`, `pnpm`, `yarn`, or `bun`). If omitted, the action detects it from lockfiles. |
| `version`                  | No       | `latest`      | Version of `@catapultjs/deploy` to execute.                                          |
| `working-directory`        | No       | `.`           | Working directory relative to the repository root.                                   |
| `private-key`              | Yes      | -             | SSH private key added to the `ssh-agent`.                                            |
| `known-hosts`              | No       | -             | Content written to `~/.ssh/known_hosts`.                                             |
| `ssh-config`               | No       | -             | Content written to `~/.ssh/config`.                                                  |
| `skip-ssh-setup`           | No       | `false`       | Skip the built-in SSH setup entirely.                                                |
| `insecure-ignore-host-key` | No       | `false`       | Disable strict host key checking when `known-hosts` is not provided.                 |

## Notes

- This action runs on the GitHub Actions `node24` runtime.
- The action installs project dependencies in the `working-directory` before running Catapult.
- SSH setup runs before the Catapult command. `private-key` is required, and you should also provide `known-hosts` unless you intentionally set `insecure-ignore-host-key: true`.
- `dist/` is the published entrypoint for the action and should be committed with source changes.

## License

MIT. See [LICENSE](./LICENSE).

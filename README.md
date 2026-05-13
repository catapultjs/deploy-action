# catapultjs/deploy-action

GitHub Action to run [`@catapultjs/deploy`](https://www.npmjs.com/package/@catapultjs/deploy) inside a workflow.

## What it does

The action executes CatapultJS deployment commands with a package manager resolved from the repository lockfile:

- `package-lock.json` -> `npx`
- `pnpm-lock.yaml` -> `pnpx`
- `yarn.lock` -> `yarn dlx`
- `bun.lock` / `bun.lockb` -> `bunx`

## Usage

Use the minimal workflow when the deployment is fully handled remotely and does not rely on local project dependencies:

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
          version: latest
```

Add a runtime setup and dependency installation when your Catapult config or deployment scripts depend on local packages:

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

      - run: npm ci

      - uses: catapultjs/deploy-action@v1
        with:
          command: deploy
          config: catapult.deploy.ts
          version: latest
          working-directory: .
          args: |
            -vvv
            -c config.ts
```

If the repository uses another package manager, replace the install command with the matching equivalent:

- `pnpm install --frozen-lockfile`
- `yarn install --immutable`
- `bun install --frozen-lockfile`

When the deployment needs SSH access, provide SSH-related inputs to prepare `~/.ssh` before running Catapult:

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
| `package-manager`          | No       | auto-detected | Package manager executable to use. If omitted, the action detects it from lockfiles. |
| `version`                  | No       | `latest`      | Version of `@catapultjs/deploy` to execute.                                          |
| `working-directory`        | No       | `.`           | Working directory relative to the repository root.                                   |
| `private-key`              | No       | -             | SSH private key added to the `ssh-agent`.                                            |
| `known-hosts`              | No       | -             | Content written to `~/.ssh/known_hosts`.                                             |
| `ssh-config`               | No       | -             | Content written to `~/.ssh/config`.                                                  |
| `skip-ssh-setup`           | No       | `false`       | Skip the built-in SSH setup entirely.                                                |
| `insecure-ignore-host-key` | No       | `false`       | Disable strict host key checking when `known-hosts` is not provided.                 |

## Notes

- This action runs on the GitHub Actions `node24` runtime.
- Installing dependencies is an optional workflow step, only needed when the deployment uses local project packages.
- SSH setup runs before the Catapult command. If `private-key` is provided, also provide `known-hosts` or set `insecure-ignore-host-key: true`.
- `dist/` is the published entrypoint for the action and should be committed with source changes.

## License

MIT. See [LICENSE](./LICENSE).

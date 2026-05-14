import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {
  detectPackageManager,
  pmExec,
  pmInstallArgs,
  resolvePackageManager,
  setupSsh,
} from './utils.js'

async function run(): Promise<void> {
  await setupSsh()

  const command = core.getInput('command') || 'deploy'
  const config = core.getInput('config')
  const extraArgs = core.getMultilineInput('args')
  const version = core.getInput('version') || 'latest'
  const cwd = core.getInput('working-directory') || '.'
  const packageManagerInput = core.getInput('package-manager')
  const packageManager = packageManagerInput
    ? resolvePackageManager(packageManagerInput)
    : await detectPackageManager(cwd)
  const pm = pmExec(packageManager)

  const args = ['--yes', `@catapultjs/deploy@${version}`, command]

  if (config) {
    args.push('--config', config)
  }

  args.push(...extraArgs)

  core.startGroup(`Installing dependencies with ${packageManager}`)
  try {
    await exec.exec(packageManager, pmInstallArgs(packageManager), { cwd })
  } finally {
    core.endGroup()
  }

  core.startGroup(`Running catapult ${command}`)
  try {
    await exec.exec(pm, args, { cwd })
  } finally {
    core.endGroup()
  }
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error))
})

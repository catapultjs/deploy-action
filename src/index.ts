import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { detectPackageManager, pmExec, setupSsh } from './utils.js'

async function run(): Promise<void> {
  await setupSsh()

  const command = core.getInput('command') || 'deploy'
  const config = core.getInput('config')
  const extraArgs = core.getMultilineInput('args')
  const version = core.getInput('version') || 'latest'
  const cwd = core.getInput('working-directory') || '.'
  const pm =
    core.getInput('package-manager') || pmExec(await detectPackageManager())

  const args = ['--yes', `@catapultjs/deploy@${version}`, command]

  if (config) {
    args.push('--config', config)
  }

  args.push(...extraArgs)

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

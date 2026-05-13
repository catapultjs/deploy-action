import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { access, appendFile, chmod, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
const PackageManager = {
    NPM: 'npm',
    PNPM: 'pnpm',
    YARN: 'yarn',
    BUN: 'bun',
};
const PM_LOCK_FILES = [
    ['bun.lock', PackageManager.BUN],
    ['bun.lockb', PackageManager.BUN],
    ['pnpm-lock.yaml', PackageManager.PNPM],
    ['yarn.lock', PackageManager.YARN],
    ['package-lock.json', PackageManager.NPM],
];
export async function getPackageLockFileName(cwd = process.cwd()) {
    for (const [lockFile] of PM_LOCK_FILES) {
        try {
            await access(resolve(cwd, lockFile));
            return lockFile;
        }
        catch { }
    }
    return false;
}
export async function detectPackageManager(cwd = process.cwd()) {
    for (const [lockFile, manager] of PM_LOCK_FILES) {
        try {
            await access(resolve(cwd, lockFile));
            return manager;
        }
        catch { }
    }
    return PackageManager.NPM;
}
export function pmExec(packageManager) {
    switch (packageManager) {
        case PackageManager.NPM:
            return 'npx';
            break;
        case PackageManager.PNPM:
            return 'pnpx';
            break;
        case PackageManager.YARN:
            return 'yarn dlx';
            break;
        case PackageManager.BUN:
            return 'bunx';
            break;
    }
    return 'npx';
}
async function addPrivateKey(privateKey) {
    await new Promise((resolvePromise, rejectPromise) => {
        const child = spawn('ssh-add', ['-'], {
            stdio: ['pipe', 'inherit', 'inherit'],
            env: process.env,
        });
        child.on('error', rejectPromise);
        child.on('close', (code) => {
            if (code === 0)
                resolvePromise();
            else
                rejectPromise(new Error(`ssh-add exited with code ${code}`));
        });
        child.stdin.write(privateKey.replace(/\r/g, '').trimEnd() + '\n');
        child.stdin.end();
    });
}
export async function setupSsh() {
    if (core.getBooleanInput('skip-ssh-setup')) {
        return;
    }
    const privateKey = core.getInput('private-key');
    const knownHosts = core.getInput('known-hosts');
    const sshConfig = core.getInput('ssh-config');
    const insecureIgnoreHostKey = core.getBooleanInput('insecure-ignore-host-key');
    if (!privateKey) {
        core.info('Skipping SSH key setup because no private-key input was provided.');
        return;
    }
    const home = process.env.HOME;
    if (!home) {
        throw new Error('HOME environment variable is not defined.');
    }
    const sshDir = resolve(home, '.ssh');
    await mkdir(sshDir, { recursive: true });
    const authSock = resolve(tmpdir(), `catapult-ssh-agent-${randomUUID()}.sock`);
    await exec.exec('ssh-agent', ['-a', authSock]);
    core.exportVariable('SSH_AUTH_SOCK', authSock);
    process.env.SSH_AUTH_SOCK = authSock;
    await addPrivateKey(privateKey);
    if (knownHosts) {
        await appendFile(resolve(sshDir, 'known_hosts'), `${knownHosts.trimEnd()}\n`, 'utf8');
        await chmod(resolve(sshDir, 'known_hosts'), 0o600);
    }
    else if (insecureIgnoreHostKey) {
        await appendFile(resolve(sshDir, 'config'), 'Host *\n  StrictHostKeyChecking no\n  UserKnownHostsFile /dev/null\n', 'utf8');
        await chmod(resolve(sshDir, 'config'), 0o600);
    }
    else {
        throw new Error('Missing known-hosts input. Provide known-hosts or set insecure-ignore-host-key to true.');
    }
    if (sshConfig) {
        await writeFile(resolve(sshDir, 'config'), sshConfig, 'utf8');
        await chmod(resolve(sshDir, 'config'), 0o600);
    }
}

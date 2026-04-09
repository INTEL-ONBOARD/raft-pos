import { execSync } from 'node:child_process'

const cwd = process.cwd()
const hasSpaceInPath = /\s/.test(cwd)
const forceInstall = process.env.FORCE_ELECTRON_APP_DEPS === '1'
const isCI = process.env.CI === 'true'

if (hasSpaceInPath && !forceInstall) {
    console.warn(
        '[postinstall] Skipping electron-builder install-app-deps because project path contains spaces.'
    )
    console.warn(
        '[postinstall] Native rebuilds may fail in this path. Move project to a path without spaces or rerun with FORCE_ELECTRON_APP_DEPS=1.'
    )
    process.exit(0)
}

if (isCI && !forceInstall) {
    console.log('[postinstall] CI detected; skipping electron-builder install-app-deps.')
    process.exit(0)
}

try {
    execSync('npx electron-builder install-app-deps', {
        stdio: 'inherit',
        env: process.env
    })
} catch (error) {
    console.error('[postinstall] Failed to run electron-builder install-app-deps.')
    process.exit(error?.status ?? 1)
}

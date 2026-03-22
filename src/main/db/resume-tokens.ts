import store from '../store/electron-store'

export function saveResumeToken(collection: string, token: unknown): void {
  const tokens = store.get('resumeTokens') as Record<string, unknown>
  store.set('resumeTokens', { ...tokens, [collection]: token })
}

export function loadResumeToken(collection: string): unknown | undefined {
  const tokens = store.get('resumeTokens') as Record<string, unknown>
  return tokens[collection]
}

export function clearResumeToken(collection: string): void {
  const tokens = store.get('resumeTokens') as Record<string, unknown>
  delete tokens[collection]
  store.set('resumeTokens', tokens)
}

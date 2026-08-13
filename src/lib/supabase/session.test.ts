import { describe, expect, it, vi } from 'vitest'

import { ensureDemoSession } from './session'

function createClient(userId: string | null) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  })
  const signInAnonymously = vi.fn().mockResolvedValue({
    data: { user: { id: 'anonymous-user' } },
    error: null,
  })
  const rpc = vi.fn().mockResolvedValue({ data: [{ company_id: 'company-1' }], error: null })

  return {
    client: { auth: { getUser, signInAnonymously }, rpc },
    getUser,
    signInAnonymously,
    rpc,
  }
}

describe('ensureDemoSession', () => {
  it('reuses an existing visitor and bootstraps its workspace', async () => {
    const fake = createClient('existing-user')

    const result = await ensureDemoSession(fake.client)

    expect(fake.signInAnonymously).not.toHaveBeenCalled()
    expect(fake.rpc).toHaveBeenCalledWith('bootstrap_demo_workspace')
    expect(result).toEqual({ userId: 'existing-user', companyId: 'company-1' })
  })

  it('creates an anonymous visitor before bootstrapping', async () => {
    const fake = createClient(null)

    const result = await ensureDemoSession(fake.client)

    expect(fake.signInAnonymously).toHaveBeenCalledOnce()
    expect(result.userId).toBe('anonymous-user')
    expect(fake.rpc).toHaveBeenCalledWith('bootstrap_demo_workspace')
  })

  it('surfaces authentication failures without calling the database', async () => {
    const fake = createClient(null)
    fake.signInAnonymously.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Anonymous sign-in is unavailable'),
    })

    await expect(ensureDemoSession(fake.client)).rejects.toThrow(
      'Anonymous sign-in is unavailable',
    )
    expect(fake.rpc).not.toHaveBeenCalled()
  })
})

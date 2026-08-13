export interface DemoSessionClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null }
      error: { message: string } | Error | null
    }>
    signInAnonymously(): Promise<{
      data: { user: { id: string } | null }
      error: { message: string } | Error | null
    }>
  }
  rpc(name: 'bootstrap_demo_workspace'): Promise<{
    data: { company_id: string }[] | { company_id: string } | null
    error: { message: string } | Error | null
  }>
}

function failureMessage(error: { message: string } | Error | null, fallback: string) {
  return error?.message || fallback
}

export async function ensureDemoSession(client: DemoSessionClient) {
  const current = await client.auth.getUser()
  if (current.error) {
    throw new Error(failureMessage(current.error, 'Could not read the demo session.'))
  }

  let user = current.data.user
  if (!user) {
    const signedIn = await client.auth.signInAnonymously()
    if (signedIn.error || !signedIn.data.user) {
      throw new Error(
        failureMessage(signedIn.error, 'Could not create an anonymous demo session.'),
      )
    }
    user = signedIn.data.user
  }

  const workspace = await client.rpc('bootstrap_demo_workspace')
  if (workspace.error || !workspace.data) {
    throw new Error(
      failureMessage(workspace.error, 'Could not initialize the demo workspace.'),
    )
  }
  const row = Array.isArray(workspace.data) ? workspace.data[0] : workspace.data
  if (!row?.company_id) {
    throw new Error('Could not initialize the demo workspace.')
  }

  return { userId: user.id, companyId: row.company_id }
}

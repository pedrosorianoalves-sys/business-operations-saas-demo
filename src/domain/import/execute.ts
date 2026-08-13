import type { ImportCatalog, ImportPlan, ImportIssue } from './types'
import { validateImportJson } from './validator'

export type ImportPersistence = (plan: ImportPlan) => Promise<Record<string, unknown>>

export async function executeValidatedImport(
  jsonText: string,
  catalog: ImportCatalog,
  persist: ImportPersistence,
): Promise<
  | { success: true; message: string; summary: Record<string, unknown>; issues: [] }
  | { success: false; message: string; summary: null; issues: ImportIssue[] }
> {
  const validation = validateImportJson(jsonText, catalog)
  if (!validation.success || !validation.plan) {
    return {
      success: false,
      message: validation.issues[0]?.message ?? 'The import payload is invalid.',
      summary: null,
      issues: validation.issues,
    }
  }

  const summary = await persist(validation.plan)
  return {
    success: true,
    message: 'Import completed in one transaction.',
    summary,
    issues: [],
  }
}

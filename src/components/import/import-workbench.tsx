'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, CircleAlert, Copy, Download, FileJson2, LoaderCircle, Play, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { importJsonPayload } from '@/actions/demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { IMPORT_EXAMPLES } from '@/domain/import/examples'
import { IMPORT_SCHEMA } from '@/domain/import/schema'
import { validateImportJson } from '@/domain/import/validator'
import type { ImportCatalog } from '@/domain/import/types'

export function ImportWorkbench({ catalog, disabled }: { catalog: ImportCatalog; disabled?: boolean }) {
  const [selected, setSelected] = useState(IMPORT_EXAMPLES[0].name)
  const [jsonText, setJsonText] = useState(IMPORT_EXAMPLES[0].json)
  const [validatedText, setValidatedText] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [pending, startTransition] = useTransition()
  const draftValidation = useMemo(() => validateImportJson(jsonText, catalog), [jsonText, catalog])
  const validation = validatedText === jsonText ? draftValidation : null

  function choose(name: typeof IMPORT_EXAMPLES[number]['name']) {
    const example = IMPORT_EXAMPLES.find((item) => item.name === name)!
    setSelected(name); setJsonText(example.json); setValidatedText(null); setSummary(null)
  }

  async function copyExample() {
    await navigator.clipboard.writeText(IMPORT_EXAMPLES.find((item) => item.name === selected)!.json)
    toast.success('Example copied to clipboard.')
  }

  function downloadSchema() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(IMPORT_SCHEMA, null, 2)], { type: 'application/schema+json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'businessops-import.schema.json'; anchor.click(); URL.revokeObjectURL(url)
  }

  function commit() {
    startTransition(async () => {
      const result = await importJsonPayload(jsonText, catalog)
      if (result.success) { toast.success(result.message); setSummary(result.details ?? {}) }
      else toast.error(result.message)
    })
  }

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-3">{IMPORT_EXAMPLES.map((example)=><button key={example.name} onClick={()=>choose(example.name)} className={`rounded-xl border p-4 text-left transition ${selected===example.name?'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100':'bg-white hover:border-slate-300'}`}><FileJson2 className={`size-4 ${selected===example.name?'text-indigo-600':'text-slate-400'}`}/><p className="mt-3 text-sm font-semibold text-slate-900">{example.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{example.description}</p></button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <Card className="gap-0 py-0"><CardHeader className="border-b py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-sm">JSON editor</CardTitle><p className="mt-1 text-xs text-muted-foreground">Edit an example or paste a supported payload.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={()=>choose(selected)}><RotateCcw/>Load example</Button><Button variant="outline" size="sm" onClick={copyExample}><Copy/>Copy example</Button><Button variant="outline" size="sm" onClick={downloadSchema}><Download/>Schema</Button><Button variant="ghost" size="sm" onClick={()=>{setJsonText('');setValidatedText(null);setSummary(null)}}><Trash2/>Clear</Button></div></div></CardHeader><CardContent className="p-0"><Textarea aria-label="JSON import editor" spellCheck={false} value={jsonText} onChange={(event)=>{setJsonText(event.target.value);setValidatedText(null);setSummary(null)}} className="min-h-[520px] resize-y rounded-none border-0 bg-[#0c152b] p-5 font-mono text-[12px] leading-6 text-slate-200 focus-visible:ring-0"/></CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm">{validation?.success?<CheckCircle2 className="size-4 text-emerald-600"/>:validation?<CircleAlert className="size-4 text-rose-600"/>:<FileJson2 className="size-4 text-indigo-600"/>}Validation</CardTitle></CardHeader><CardContent>{!validation?<div><p className="text-xs leading-5 text-slate-500">Validate the current editor contents to generate an exact import plan and preview.</p><Button className="mt-4 w-full" variant="outline" onClick={()=>setValidatedText(jsonText)}><ShieldCheck/>Validate JSON</Button></div>:validation.success?<p className="text-xs leading-5 text-emerald-700">Payload is valid, references resolve, units are compatible, and the plan is ready.</p>:<div><div className="max-h-48 space-y-2 overflow-auto">{validation.issues.map((issue,index)=><div key={`${issue.path}-${index}`} className="rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs"><code className="font-semibold text-rose-800">{issue.path}</code><p className="mt-1 text-rose-700">{issue.message}</p></div>)}</div><Button className="mt-4 w-full" variant="outline" onClick={()=>setValidatedText(jsonText)}><ShieldCheck/>Validate again</Button></div>}</CardContent></Card>
        {validation?.preview&&<Card><CardHeader><CardTitle className="text-sm">Import preview</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2">{Object.entries(validation.preview.counts).map(([key,value])=><div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">{key}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}</div><div className="space-y-1 text-xs text-slate-600">{validation.preview.customers.map((item)=><p key={item.name}>Customer · {item.name} <strong className="float-right capitalize">{item.action}</strong></p>)}{validation.preview.products.map((item)=><p key={item.name}>Product · {item.name} <strong className="float-right capitalize">{item.action}</strong></p>)}{validation.preview.recipes.map((item)=><p key={item.product}>Recipe · {item.product} <strong className="float-right">{item.itemCount} lines</strong></p>)}{validation.preview.orders.map((item,index)=><p key={`${item.customer}-${index}`}>Order · {item.customer} <strong className="float-right">{item.itemCount} items</strong></p>)}</div></CardContent></Card>}
        <Card className="border-indigo-100 bg-indigo-50/50"><CardContent className="space-y-3 pt-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-indigo-600"/><div><p className="text-sm font-semibold text-indigo-950">Atomic commit</p><p className="mt-1 text-xs leading-5 text-indigo-700">The normalized plan is validated again on the server and committed by one PostgreSQL transaction. Any failure rolls back every record.</p></div></div><Button className="w-full" size="lg" disabled={disabled||!validation?.success||pending} onClick={commit}>{pending?<LoaderCircle className="animate-spin"/>:<Play/>}{disabled?'Connect Supabase to commit':pending?'Importing…':'Confirm and import'}</Button></CardContent></Card>
        {summary&&<Card className="border-emerald-200"><CardHeader><CardTitle className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="size-4"/>Import summary</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">{Object.entries(summary).map(([key,value])=><div key={key} className="rounded-lg bg-emerald-50 p-2.5"><p className="text-[10px] text-emerald-600">{key}</p><p className="font-semibold text-emerald-950">{String(value)}</p></div>)}</CardContent></Card>}
      </div>
    </div>
  </div>
}

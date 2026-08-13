import type { Metadata } from 'next'

import { ImportWorkbench } from '@/components/import/import-workbench'
import { PageHeader } from '@/components/page-header'
import { PortfolioNotice } from '@/components/portfolio-notice'
import { loadDemoData } from '@/data/server'

export const metadata: Metadata = { title: 'Data Import' }

export default async function DataImportPage(){const data=await loadDemoData();const catalog={customers:data.customers.map(({id,name,phone,email})=>({id,name,phone,email})),products:data.products.map(({id,name,price})=>({id,name,price})),ingredients:data.ingredients.map(({id,name,unit})=>({id,name,unit}))};return <div className="space-y-6"><PageHeader eyebrow="Flagship workflow" title="Validated JSON import" description="Normalize customers, products, ingredients, recipes, and order batches before one atomic database commit."/><PortfolioNotice message={data.sourceMessage}/><ImportWorkbench catalog={catalog} disabled={data.source!=='supabase'}/></div>}

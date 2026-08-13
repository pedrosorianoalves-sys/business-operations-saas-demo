import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

import { createPreviewData } from './preview'
import type { DemoData } from './types'

type UnknownRow = Record<string, unknown>

function rows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : []
}

function relation(value: unknown): UnknownRow | null {
  if (Array.isArray(value)) return (value[0] as UnknownRow | undefined) ?? null
  return value && typeof value === 'object' ? (value as UnknownRow) : null
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

function numeric(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function loadDemoData(): Promise<DemoData> {
  const client = await createServerSupabaseClient()
  if (!client) return createPreviewData()

  try {
    const [companyResult, customersResult, productsResult, ingredientsResult, recipesResult, purchasesResult, ordersResult] =
      await Promise.all([
        client.from('companies').select('name').limit(1).maybeSingle(),
        client.from('customers').select('*').order('total_spent', { ascending: false }),
        client.from('products').select('*').order('name'),
        client.from('ingredients').select('*').order('name'),
        client
          .from('recipes')
          .select('*, products(name, estimated_cost), recipe_items(*, ingredients(name))')
          .order('created_at'),
        client
          .from('ingredient_purchases')
          .select('*, ingredients(name)')
          .order('purchased_at', { ascending: false }),
        client
          .from('orders')
          .select('*, customers(name), order_items(*, products(name))')
          .order('ordered_at', { ascending: false }),
      ])

    const failed = [
      companyResult,
      customersResult,
      productsResult,
      ingredientsResult,
      recipesResult,
      purchasesResult,
      ordersResult,
    ].find((result) => result.error)
    if (failed?.error) throw failed.error

    return {
      source: 'supabase',
      sourceMessage: null,
      companyName: text((companyResult.data as UnknownRow | null)?.name, 'BusinessOps Demo'),
      customers: rows(customersResult.data).map((row) => ({
        id: text(row.id),
        name: text(row.name),
        phone: nullableText(row.phone),
        email: nullableText(row.email),
        notes: nullableText(row.notes),
        total_spent: numeric(row.total_spent),
        total_orders: numeric(row.total_orders),
        last_order_at: nullableText(row.last_order_at),
      })),
      products: rows(productsResult.data).map((row) => ({
        id: text(row.id),
        name: text(row.name),
        category: nullableText(row.category),
        description: nullableText(row.description),
        price: numeric(row.price),
        estimated_cost: numeric(row.estimated_cost),
        gross_profit: numeric(row.gross_profit),
        gross_margin_percent: numeric(row.gross_margin_percent),
        is_active: Boolean(row.is_active),
      })),
      ingredients: rows(ingredientsResult.data).map((row) => ({
        id: text(row.id),
        name: text(row.name),
        unit: text(row.unit, 'unit') as DemoData['ingredients'][number]['unit'],
        current_stock: numeric(row.current_stock),
        minimum_stock: numeric(row.minimum_stock),
        average_cost: numeric(row.average_cost),
        supplier: nullableText(row.supplier),
      })),
      recipes: rows(recipesResult.data).map((row) => {
        const product = relation(row.products)
        return {
          id: text(row.id),
          product_id: text(row.product_id),
          product_name: text(product?.name, 'Unknown product'),
          yield_quantity: numeric(row.yield_quantity),
          estimated_cost: numeric(product?.estimated_cost),
          items: rows(row.recipe_items).map((item) => ({
            id: text(item.id),
            ingredient_id: text(item.ingredient_id),
            ingredient_name: text(relation(item.ingredients)?.name, 'Unknown ingredient'),
            quantity: numeric(item.quantity),
            unit: text(item.unit, 'unit') as DemoData['ingredients'][number]['unit'],
          })),
        }
      }),
      purchases: rows(purchasesResult.data).map((row) => ({
        id: text(row.id),
        ingredient_id: text(row.ingredient_id),
        ingredient_name: text(relation(row.ingredients)?.name, 'Unknown ingredient'),
        quantity: numeric(row.quantity),
        unit_cost: numeric(row.unit_cost),
        total_cost: numeric(row.total_cost),
        supplier: nullableText(row.supplier),
        purchased_at: text(row.purchased_at),
      })),
      orders: rows(ordersResult.data).map((row) => ({
        id: text(row.id),
        customer_id: nullableText(row.customer_id),
        customer_name: text(relation(row.customers)?.name, 'Walk-in customer'),
        status: text(row.status, 'pending') as DemoData['orders'][number]['status'],
        payment_method: text(row.payment_method, 'cash') as DemoData['orders'][number]['payment_method'],
        subtotal: numeric(row.subtotal),
        discount: numeric(row.discount),
        total: numeric(row.total),
        estimated_cost: numeric(row.estimated_cost),
        gross_profit: numeric(row.gross_profit),
        gross_margin_percent: numeric(row.gross_margin_percent),
        ordered_at: text(row.ordered_at),
        items: rows(row.order_items).map((item) => ({
          product_id: text(item.product_id),
          product_name: text(relation(item.products)?.name, 'Unknown product'),
          quantity: numeric(item.quantity),
          unit_price: numeric(item.unit_price),
        })),
      })),
    }
  } catch (error) {
    const preview = createPreviewData()
    preview.sourceMessage = `Live data is temporarily unavailable. Showing the deterministic portfolio preview. ${
      error instanceof Error ? error.message : ''
    }`.trim()
    return preview
  }
}

'use server'

import { revalidatePath } from 'next/cache'

import { optionalText, parsePositiveNumber, requireText } from '@/domain/forms'
import { executeValidatedImport } from '@/domain/import/execute'
import type { ImportCatalog } from '@/domain/import/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ActionResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

function value(formData: FormData, key: string) {
  return formData.get(key)
}

async function requireClient() {
  const client = await createServerSupabaseClient()
  if (!client) {
    throw new Error('Connect the dedicated Supabase project to enable mutations.')
  }
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('The anonymous demo session is unavailable.')
  return client
}

function resultError(error: unknown): ActionResult {
  return {
    success: false,
    message: error instanceof Error ? error.message : 'The operation could not be completed.',
  }
}

function refresh() {
  revalidatePath('/', 'layout')
}

export async function saveCustomer(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const id = optionalText(value(formData, 'id'))
    const payload = {
      name: requireText(value(formData, 'name'), 'Name'),
      phone: optionalText(value(formData, 'phone')),
      email: optionalText(value(formData, 'email')),
      notes: optionalText(value(formData, 'notes')),
    }
    const query = id
      ? client.from('customers').update(payload).eq('id', id)
      : client.from('customers').insert(payload)
    const { error } = await query
    if (error) throw error
    refresh()
    return { success: true, message: id ? 'Customer updated.' : 'Customer created.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function deleteCustomer(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const id = requireText(value(formData, 'id'), 'Customer')
    const { error } = await client.from('customers').delete().eq('id', id)
    if (error) throw error
    refresh()
    return { success: true, message: 'Customer deleted.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const id = optionalText(value(formData, 'id'))
    const payload = {
      name: requireText(value(formData, 'name'), 'Name'),
      category: optionalText(value(formData, 'category')),
      description: optionalText(value(formData, 'description')),
      price: parsePositiveNumber(value(formData, 'price'), 'Price'),
      is_active: value(formData, 'isActive') !== 'false',
    }
    const query = id
      ? client.from('products').update(payload).eq('id', id)
      : client.from('products').insert(payload)
    const { error } = await query
    if (error) throw error
    refresh()
    return { success: true, message: id ? 'Product updated.' : 'Product created.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function deleteProduct(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', requireText(value(formData, 'id'), 'Product'))
    if (error) throw error
    refresh()
    return { success: true, message: 'Product deleted.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function saveIngredient(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const id = optionalText(value(formData, 'id'))
    const payload = {
      name: requireText(value(formData, 'name'), 'Name'),
      unit: requireText(value(formData, 'unit'), 'Unit'),
      current_stock: parsePositiveNumber(value(formData, 'currentStock'), 'Current stock', {
        allowZero: true,
      }),
      minimum_stock: parsePositiveNumber(value(formData, 'minimumStock'), 'Minimum stock', {
        allowZero: true,
      }),
      average_cost: parsePositiveNumber(value(formData, 'averageCost'), 'Average cost', {
        allowZero: true,
      }),
      supplier: optionalText(value(formData, 'supplier')),
    }
    const query = id
      ? client.from('ingredients').update(payload).eq('id', id)
      : client.from('ingredients').insert(payload)
    const { error } = await query
    if (error) throw error
    refresh()
    return { success: true, message: id ? 'Ingredient updated.' : 'Ingredient created.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function deleteIngredient(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client
      .from('ingredients')
      .delete()
      .eq('id', requireText(value(formData, 'id'), 'Ingredient'))
    if (error) throw error
    refresh()
    return { success: true, message: 'Ingredient deleted.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function recordPurchase(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client.rpc('record_ingredient_purchase', {
      p_ingredient_id: requireText(value(formData, 'ingredientId'), 'Ingredient'),
      p_quantity: parsePositiveNumber(value(formData, 'quantity'), 'Quantity'),
      p_unit_cost: parsePositiveNumber(value(formData, 'unitCost'), 'Unit cost', {
        allowZero: true,
      }),
      p_supplier: optionalText(value(formData, 'supplier')),
      p_purchased_at: optionalText(value(formData, 'purchasedAt')),
    })
    if (error) throw error
    refresh()
    return { success: true, message: 'Purchase recorded and stock updated.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function adjustInventory(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client.rpc('adjust_inventory', {
      p_ingredient_id: requireText(value(formData, 'ingredientId'), 'Ingredient'),
      p_adjustment_type: requireText(value(formData, 'adjustmentType'), 'Adjustment type'),
      p_quantity: parsePositiveNumber(value(formData, 'quantity'), 'Quantity'),
      p_reason: requireText(value(formData, 'reason'), 'Reason'),
    })
    if (error) throw error
    refresh()
    return { success: true, message: 'Inventory adjustment applied.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function saveRecipe(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const rawItems = requireText(value(formData, 'items'), 'Recipe ingredients')
    const items = JSON.parse(rawItems)
    const { error } = await client.rpc('save_recipe', {
      p_product_id: requireText(value(formData, 'productId'), 'Product'),
      p_items: items,
    })
    if (error) throw error
    refresh()
    return { success: true, message: 'Recipe saved and product margins recalculated.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function deleteRecipe(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client.rpc('delete_recipe', {
      p_recipe_id: requireText(value(formData, 'id'), 'Recipe'),
    })
    if (error) throw error
    refresh()
    return { success: true, message: 'Recipe deleted and product metrics reset.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function createOrder(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const items = JSON.parse(requireText(value(formData, 'items'), 'Order items'))
    const { error } = await client.rpc('create_demo_order', {
      p_customer_id: requireText(value(formData, 'customerId'), 'Customer'),
      p_payment_method: requireText(value(formData, 'paymentMethod'), 'Payment method'),
      p_status: requireText(value(formData, 'status'), 'Status'),
      p_items: items,
      p_discount: parsePositiveNumber(value(formData, 'discount') || '0', 'Discount', {
        allowZero: true,
      }),
      p_notes: optionalText(value(formData, 'notes')),
    })
    if (error) throw error
    refresh()
    return { success: true, message: 'Order created.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function updateOrderStatus(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const id = requireText(value(formData, 'id'), 'Order')
    const operation = requireText(value(formData, 'operation'), 'Operation')
    const { error } = await client.rpc(
      operation === 'complete' ? 'mark_order_paid' : 'cancel_order',
      { p_order_id: id },
    )
    if (error) throw error
    refresh()
    return { success: true, message: operation === 'complete' ? 'Order paid.' : 'Order cancelled.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function deletePendingOrder(formData: FormData): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { error } = await client
      .from('orders')
      .delete()
      .eq('id', requireText(value(formData, 'id'), 'Order'))
      .eq('status', 'pending')
    if (error) throw error
    refresh()
    return { success: true, message: 'Pending order deleted.' }
  } catch (error) {
    return resultError(error)
  }
}

export async function resetDemo(): Promise<ActionResult> {
  try {
    const client = await requireClient()
    const { data, error } = await client.rpc('reset_demo_workspace')
    if (error) throw error
    refresh()
    return { success: true, message: 'Demo data restored.', details: data ?? undefined }
  } catch (error) {
    return resultError(error)
  }
}

export async function importJsonPayload(
  jsonText: string,
  catalog: ImportCatalog,
): Promise<ActionResult> {
  try {
    const result = await executeValidatedImport(jsonText, catalog, async (plan) => {
      const client = await requireClient()
      const { data, error } = await client.rpc('import_demo_payload', {
        p_payload: plan,
      })
      if (error) throw error
      return (data ?? {}) as Record<string, unknown>
    })
    if (!result.success) {
      return { success: false, message: result.message, details: { issues: result.issues } }
    }
    refresh()
    return { success: true, message: result.message, details: result.summary }
  } catch (error) {
    return resultError(error)
  }
}

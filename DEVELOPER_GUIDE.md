# Developer Guide - Server-Side Architecture

## Quick Reference for Working with the New Architecture

---

## 🏗️ Creating a New Admin Page

Follow this pattern for any new admin page:

### Step 1: Create Server Actions (`actions.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Fetch data
export async function getItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data || []
}

// Create item
export async function createItemAction(input: CreateItemInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('items')
    .insert({ ...input, created_by: user.id })

  if (error) {
    console.error('Error creating item:', error)
    throw new Error('Failed to create item')
  }

  revalidatePath('/admin/items')
  return { success: true }
}

// Update item
export async function updateItemAction(id: string, updates: Partial<CreateItemInput>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating item:', error)
    throw new Error('Failed to update item')
  }

  revalidatePath('/admin/items')
  return { success: true }
}

// Delete item
export async function deleteItemAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    throw new Error('Failed to delete item')
  }

  revalidatePath('/admin/items')
  return { success: true }
}
```

### Step 2: Create Client Component (`ItemsClient.tsx`)

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createItemAction, updateItemAction, deleteItemAction } from './actions'

interface ItemsClientProps {
  initialItems: Item[]
}

export default function ItemsClient({ initialItems }: ItemsClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(formData: CreateItemInput) {
    setIsSubmitting(true)
    try {
      await createItemAction(formData)
      toast.success('Item created successfully')
      setIsDialogOpen(false)

      // Refresh server component
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error('Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Your UI here */}
    </div>
  )
}
```

### Step 3: Create Server Component Page (`page.tsx`)

```typescript
import AdminLayout from '@/components/admin/AdminLayout'
import ItemsClient from './ItemsClient'
import { getItems } from './actions'

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
  const items = await getItems()

  return (
    <AdminLayout>
      <ItemsClient initialItems={items} />
    </AdminLayout>
  )
}
```

---

## 🔐 Adding RLS Policies

When creating new tables, always add RLS policies:

```sql
-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage items"
  ON public.your_table FOR ALL
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Users can view their own items
CREATE POLICY "Users can view own items"
  ON public.your_table FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## 🎯 Common Patterns

### Pattern 1: Fetching Data with Filters

```typescript
export async function getItems(filters?: {
  category?: string
  status?: string
}) {
  const supabase = await createClient()

  let query = supabase.from('items').select('*')

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error:', error)
    return []
  }

  return data || []
}
```

### Pattern 2: Parallel Data Fetching

```typescript
export default async function Page() {
  // Fetch multiple things in parallel
  const [items, categories, users] = await Promise.all([
    getItems(),
    getCategories(),
    getUsers(),
  ])

  return <YourComponent data={{ items, categories, users }} />
}
```

### Pattern 3: Optimistic Updates

```typescript
'use client'

export default function ItemsClient({ items }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleUpdate(id: string, data: UpdateData) {
    try {
      await updateItemAction(id, data)
      toast.success('Updated')

      // Trigger server component refresh
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error('Failed')
    }
  }
}
```

### Pattern 4: Form Handling

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    if (editingItem) {
      await updateItemAction(editingItem.id, formData)
      toast.success('Updated successfully')
    } else {
      await createItemAction(formData)
      toast.success('Created successfully')
    }

    setIsDialogOpen(false)
    startTransition(() => router.refresh())
  } catch (error) {
    toast.error('Operation failed')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Import client-side Supabase in server actions
```typescript
// DON'T DO THIS
import { createClient } from '@/lib/supabase/client' // Wrong!
```

### ✅ Do: Use server-side Supabase
```typescript
// DO THIS
import { createClient } from '@/lib/supabase/server' // Correct!
```

---

### ❌ Don't: Forget to revalidate after mutations
```typescript
export async function updateItem(id: string, data: any) {
  const supabase = await createClient()
  await supabase.from('items').update(data).eq('id', id)
  // Missing revalidatePath! ❌
}
```

### ✅ Do: Always revalidate
```typescript
export async function updateItem(id: string, data: any) {
  const supabase = await createClient()
  await supabase.from('items').update(data).eq('id', id)
  revalidatePath('/admin/items') // ✅
}
```

---

### ❌ Don't: Use 'use client' on pages that only fetch data
```typescript
'use client' // ❌ Unnecessary

export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### ✅ Do: Keep pages as server components
```typescript
// No 'use client' directive ✅

export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

---

### ❌ Don't: Forget error handling
```typescript
export async function getItems() {
  const supabase = await createClient()
  const { data } = await supabase.from('items').select('*')
  return data // ❌ No error handling!
}
```

### ✅ Do: Always handle errors
```typescript
export async function getItems() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('items').select('*')

  if (error) {
    console.error('Error:', error)
    return []
  }

  return data || []
}
```

---

## 🔧 Debugging Tips

### 1. Check Server Logs
Server actions run on the server, so check the terminal:
```bash
npm run dev
# Watch for console.error outputs
```

### 2. Use React DevTools
Check if data is being passed correctly to client components

### 3. Verify Database Permissions
If queries fail, check RLS policies in Supabase:
```sql
-- Test as specific user
SET request.jwt.claims.sub TO 'user-id-here';
SELECT * FROM your_table;
```

### 4. Check Network Tab
Server actions appear as POST requests to the current route

---

## 📊 Performance Best Practices

### 1. Parallel Data Fetching
```typescript
// Good ✅
const [users, posts, comments] = await Promise.all([
  getUsers(),
  getPosts(),
  getComments(),
])

// Bad ❌ (Sequential)
const users = await getUsers()
const posts = await getPosts()
const comments = await getComments()
```

### 2. Selective Data Fetching
```typescript
// Good ✅ - Only select needed fields
const { data } = await supabase
  .from('users')
  .select('id, name, email')

// Bad ❌ - Fetches everything
const { data } = await supabase
  .from('users')
  .select('*')
```

### 3. Use Indexes
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_classes_church_id ON classes(church_id);
```

---

## 🧪 Testing Server Actions

```typescript
// __tests__/actions.test.ts
import { getItems, createItemAction } from '../actions'

jest.mock('@/lib/supabase/server')

describe('Item Actions', () => {
  it('should fetch items', async () => {
    const items = await getItems()
    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
  })

  it('should create item', async () => {
    const result = await createItemAction({
      name: 'Test Item',
      description: 'Test'
    })
    expect(result.success).toBe(true)
  })
})
```

---

## 🎓 Learning Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## 💡 Pro Tips

1. **Use TypeScript**: Define types for all your data structures
2. **Consistent naming**: `[entity]Action` for actions, `get[Entities]Data` for fetches
3. **Error boundaries**: Add error boundaries around server components
4. **Loading states**: Use `loading.tsx` files for automatic loading states
5. **Suspense**: Wrap components in Suspense for better UX
6. **Cache strategically**: Use `revalidatePath()` or `revalidateTag()`
7. **Monitor performance**: Use Next.js Analytics
8. **Security first**: Always validate input on the server
9. **Consistent patterns**: Follow the established architecture
10. **Document changes**: Update this guide when adding new patterns

---

**Last Updated:** November 30, 2025

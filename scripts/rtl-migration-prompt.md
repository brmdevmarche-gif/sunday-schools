# RTL CSS Migration Prompt (for Claude Code)

## Task

Migrate all physical CSS properties to logical CSS properties for proper RTL (Arabic) support.

## Why

The accessibility audit found 284 instances of physical CSS properties that break in RTL mode. Tailwind logical properties ensure the UI mirrors correctly for Arabic users.

## Migration Map

| Physical (NEVER use) | Logical (USE instead) |
|----------------------|----------------------|
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `border-l-*` | `border-s-*` |
| `border-r-*` | `border-e-*` |
| `rounded-l-*` | `rounded-s-*` |
| `rounded-r-*` | `rounded-e-*` |

## Exceptions (DO NOT change)

- `-translate-x-*` transforms
- `left-1/2` centering patterns
- Explicit `ltr:` / `rtl:` overrides
- `left-0 right-0` → use `inset-x-0` instead
- `scroll-pl-*` / `scroll-pr-*` → `scroll-ps-*` / `scroll-pe-*`

## Rules

1. Search ALL `.tsx` and `.ts` files in `src/` for physical CSS class names
2. Replace each with its logical equivalent from the table above
3. Be careful with combined classes like `rounded-l-lg` → `rounded-s-lg`
4. DO NOT touch files in `node_modules/` or `.next/`
5. Preserve all other classes on the same element
6. The inventory of all instances is in `rtl-fix-inventory.md` at project root

## Verification

After completing all migrations, run:
```bash
# Check no physical properties remain
grep -rn "\\bpl-\\|\\bpr-\\|\\bml-\\|\\bmr-\\|\\btext-left\\|\\btext-right\\|\\bborder-l-\\|\\bborder-r-\\|\\brounded-l-\\|\\brounded-r-" src/ --include="*.tsx" --include="*.ts" | grep -v "ltr:" | grep -v "rtl:" | grep -v "translate-x" | grep -v "left-1/2" | wc -l
# Should be 0 or very close to 0

npx tsc --noEmit
npm run lint
```

import {
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  CookingPot,
  DatabaseZap,
  FileJson2,
  LayoutDashboard,
  PackageOpen,
  ReceiptText,
  ShoppingBasket,
  UsersRound,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: UsersRound },
  { href: '/products', label: 'Products', icon: ShoppingBasket },
  { href: '/ingredients', label: 'Ingredients', icon: PackageOpen },
  { href: '/recipes', label: 'Recipes', icon: CookingPot },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/purchases', label: 'Purchases', icon: ReceiptText },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { href: '/data-import', label: 'Data Import', icon: FileJson2 },
  { href: '/technical-overview', label: 'Technical Overview', icon: DatabaseZap },
]

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  FileText, 
  Wallet,
  User,
  Store,
} from 'lucide-react';

const navItems = [
 
  { name: 'Tableau de bord', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Point de vente', href: '/dashboard/pos', icon: Store },  
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Crédits clients', href: '/dashboard/credits', icon: CreditCard },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Profil', href: '/dashboard/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-gray-800">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Tenant SaaS</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

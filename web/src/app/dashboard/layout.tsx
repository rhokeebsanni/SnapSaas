import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/dashboard/user-menu';
import { getServerSession } from '@/lib/session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const { user } = session;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" aria-label="SnapSaas dashboard">
              <Logo />
            </Link>
            <nav className="text-muted-foreground hidden items-center gap-4 text-sm sm:flex">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Overview
              </Link>
              <Link href="/dashboard/editor" className="hover:text-foreground transition-colors">
                New capture
              </Link>
              <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">
                Projects
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { getServerSession } from '@/lib/session';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <Link href="/" className="mb-8" aria-label="SnapSaas home">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

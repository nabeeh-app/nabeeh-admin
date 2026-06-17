'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';

const translations = {
  en: {
    title: 'Nabeeh Admin',
    subtitle: 'Sign in to admin panel',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    invalidCredentials: 'Invalid email or password',
    accessDenied: 'Access denied. You are not an admin user.',
    emailPlaceholder: 'admin@nabeeh.app',
    passwordPlaceholder: '••••••••',
    loading: 'Loading...',
  },
  ar: {
    title: 'نابيه — لوحة التحكم',
    subtitle: 'تسجيل الدخول إلى لوحة التحكم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جاري تسجيل الدخول...',
    invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
    accessDenied: 'تم رفض الوصول. أنت لست مسؤولًا.',
    emailPlaceholder: 'admin@nabeeh.app',
    passwordPlaceholder: '••••••••',
    loading: 'جاري التحميل...',
  },
} as const;

type Locale = keyof typeof translations;

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = translations[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = supabaseBrowser;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(t.invalidCredentials);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (adminError || !adminUser) {
      setError(t.accessDenied);
      setLoading(false);
      return;
    }

    await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: authData.session.access_token }),
    });

    const from = searchParams.get('from') || '/';
    router.push(from);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="text-xs font-mono uppercase tracking-wider text-ink/50 hover:text-ink transition-colors px-3 py-1 border border-ink/20 hover:border-ink/40"
          >
            {locale === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-ink font-display">{t.title}</h1>
          <p className="text-ink/60 mt-2 font-body">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 font-body">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3 border border-ink bg-canvas font-body focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={t.emailPlaceholder}
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-3 border border-ink bg-canvas font-body focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={t.passwordPlaceholder}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-accent text-ink font-body font-medium uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-ink/70 font-body">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { isSupabaseConfigured, signInWithGoogle, signOut, getCurrentUser, onAuthChange } from '../services/supabaseService';

interface Props {
  systemLanguage: 'en' | 'ko' | 'zh';
}

const label = {
  en: { signIn: 'Sign in', signOut: 'Sign out' },
  ko: { signIn: '로그인', signOut: '로그아웃' },
  zh: { signIn: '登入', signOut: '登出' },
};

export function AuthButton({ systemLanguage }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const l = label[systemLanguage];

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getCurrentUser().then(setUser);
    const { data: { subscription } } = onAuthChange(setUser);
    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <UserIcon size={13} />
          <span className="hidden lg:block truncate max-w-[120px]">{user.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-text-muted rounded transition-colors"
        >
          <LogOut size={11} /> {l.signOut}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithGoogle()}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-accent text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <LogIn size={13} /> {l.signIn}
    </button>
  );
}

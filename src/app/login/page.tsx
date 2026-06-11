'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EqualizeLogo } from '@/components/icons';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.35.73 4.1 1.5l2.43-2.42C19.2 3.46 16.2.92 12.48.92c-5.17 0-9.4 4.15-9.4 9.25s4.23 9.25 9.4 9.25c2.82 0 4.95-.94 6.62-2.62 1.83-1.83 2.25-4.32 2.25-6.2v-1.1H12.48z" />
    </svg>
);

const sampleLedger = [
  { entry: 'Goa trip — beach shack', who: 'Ravi owes you', amount: '₹850' },
  { entry: 'Flat 4B — electricity', who: 'You owe Priya', amount: '₹500' },
  { entry: 'Office lunch, Friday', who: 'Anjali owes you', amount: '₹1,200' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
          variant: 'destructive',
          title: 'Missing Fields',
          description: 'Please enter both email and password.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { auth } = await import('@/lib/firebase');
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      const title = isSignUp ? 'Sign Up Failed' : 'Sign In Failed';
      let description = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'This email is already registered. Please sign in or use a different email.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. It must be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid. Please enter a valid email.';
          break;
        case 'auth/invalid-credential':
          description = 'Invalid email or password. Please check your credentials and try again.';
          break;
        default:
          description = error.message;
      }
      toast({ variant: 'destructive', title, description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { auth } = await import('@/lib/firebase');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* The khata cover — ruled ink-green panel with a red margin line */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(var(--sidebar-background))] p-12 text-[hsl(var(--sidebar-foreground))] lg:flex">
        <div className="ledger-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="absolute inset-y-0 left-20 w-px bg-[hsl(12,60%,52%)]/50"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3 pl-12">
          <EqualizeLogo className="size-9 text-[hsl(var(--sidebar-primary))]" />
          <span className="font-headline text-2xl font-semibold italic">
            Equalize
          </span>
        </div>

        <div className="relative pl-12">
          <p className="font-code text-xs uppercase tracking-[0.3em] text-[hsl(var(--sidebar-foreground))]/60">
            The shared account book
          </p>
          <h1 className="mt-4 max-w-xl font-headline text-5xl font-light leading-[1.1] xl:text-6xl">
            Split expenses,{' '}
            <em className="font-semibold text-[hsl(var(--sidebar-primary))]">
              not friendships.
            </em>
          </h1>

          <div className="mt-12 max-w-md">
            {sampleLedger.map((row, i) => (
              <div
                key={i}
                className="anim-rise flex items-baseline justify-between gap-4 border-b border-dashed border-[hsl(var(--sidebar-border))] py-3"
                style={{ animationDelay: `${200 + i * 150}ms` }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{row.entry}</p>
                  <p className="font-code text-xs text-[hsl(var(--sidebar-foreground))]/55">
                    {row.who}
                  </p>
                </div>
                <span className="tnum shrink-0 font-code text-sm text-[hsl(var(--sidebar-primary))]">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative pl-12 font-code text-xs text-[hsl(var(--sidebar-foreground))]/45">
          № 0001 · Every rupee accounted for
        </p>
      </div>

      {/* The entry form — paper side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="anim-rise w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <EqualizeLogo className="size-8 text-primary" />
            <span className="font-headline text-2xl font-semibold italic">Equalize</span>
          </div>

          <p className="font-code text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {isSignUp ? 'New account' : 'Account holder'}
          </p>
          <h2 className="mt-2 font-headline text-4xl font-medium">
            {isSignUp ? 'Open your khata' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? 'Create an account to start splitting expenses.'
              : 'Sign in to pick up where the ledger left off.'}
          </p>

          <form onSubmit={handleAuthAction} className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-code text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-card"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="font-code text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="h-11 bg-card"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-11 w-full text-base">
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 font-code text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="h-11 w-full gap-2 bg-card" onClick={handleGoogleSignIn} disabled={isLoading}>
            <GoogleIcon />
            {isLoading ? 'Redirecting...' : 'Google'}
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => setIsSignUp(false)} disabled={isLoading}>
                  Sign In
                </Button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => setIsSignUp(true)} disabled={isLoading}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

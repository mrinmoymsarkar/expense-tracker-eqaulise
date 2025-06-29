
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authAction, setAuthAction] = useState<'signIn' | 'signUp' | 'google' | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    if (!email || !password) {
      toast({
          variant: 'destructive',
          title: 'Missing Fields',
          description: 'Please enter both email and password.',
      });
      return;
    }
    
    setAuthAction(action);
    setIsLoading(true);

    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      switch (error.code) {
        case 'auth/invalid-credential':
          description = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/email-already-in-use':
          description = 'This email address is already registered. Please sign in or use a different email.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. It must be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
            description = 'The email address is not valid. Please enter a valid email.';
            break;
        default:
            description = error.message; // Fallback to the original error message
      }

      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
      setAuthAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthAction('google');
    setIsLoading(true);
    try {
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
      setAuthAction(null);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <EqualizeLogo className="size-8 text-primary" />
                <CardTitle className="font-headline text-3xl">Equalize</CardTitle>
            </div>
          <CardDescription>
            Split expenses, not friendships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => handleAuthAction('signIn')} disabled={isLoading} className="w-full">
                {isLoading && authAction === 'signIn' ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button onClick={() => handleAuthAction('signUp')} disabled={isLoading} className="w-full" variant="secondary">
                {isLoading && authAction === 'signUp' ? 'Signing Up...' : 'Sign Up'}
                </Button>
            </div>
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={isLoading}>
            <GoogleIcon />
            {isLoading && authAction === 'google' ? 'Redirecting...' : 'Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

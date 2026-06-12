'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, LogOut } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useData } from '@/components/providers/data-provider';
import { useToast } from '@/hooks/use-toast';
import type { Currency, DateFormat, Language } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Profile tab                                                         */
/* ------------------------------------------------------------------ */

function ProfileSettings() {
  const { profile, profileLoading, updateProfile } = useData();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [saving, setSaving] = useState(false);

  /* Reset fields when profile loads */
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setUpiId(profile.upiId ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName, upiId });
      toast({ title: 'Profile saved' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message ?? 'Could not update your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { auth } = await import('@/lib/firebase');
    await auth.signOut();
  };

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? 'ME';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-medium">Profile</CardTitle>
        <CardDescription>Manage your public profile information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            {profile?.photoURL ? (
              <AvatarImage src={profile.photoURL} alt={profile.displayName} data-ai-hint="profile picture" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Full Name
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
            />
          )}
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Email
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="cursor-not-allowed opacity-60"
              />
              <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-muted-foreground">
                Managed by your sign-in provider — cannot be changed here
              </p>
            </>
          )}
        </div>

        {/* UPI ID */}
        <div className="space-y-2">
          <Label htmlFor="upi" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            UPI ID
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Input
                id="upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
              />
              <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-muted-foreground">
                Used by friends to pay you directly
              </p>
            </>
          )}
        </div>

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving || profileLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>

        {/* Sign out */}
        <div className="border-t border-dashed pt-4">
          <Button
            variant="outline"
            className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Preferences tab                                                     */
/* ------------------------------------------------------------------ */

function PreferencesSettings() {
  const { profile, profileLoading, updateProfile } = useData();
  const { toast } = useToast();

  const [currency, setCurrency] = useState<Currency>('INR');
  const [dateFormat, setDateFormat] = useState<DateFormat>('dd-MM-yyyy');
  const [language, setLanguage] = useState<Language>('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCurrency(profile.currency ?? 'INR');
      setDateFormat(profile.dateFormat ?? 'dd-MM-yyyy');
      setLanguage(profile.language ?? 'en');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ currency, dateFormat, language });
      toast({ title: 'Preferences saved' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message ?? 'Could not update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-medium">Preferences</CardTitle>
        <CardDescription>Customize the application to your liking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme */}
        <div className="space-y-2">
          <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Theme
          </Label>
          <ThemeToggle />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Default Currency
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Language
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Date format */}
        <div className="space-y-2">
          <Label htmlFor="date-format" className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Date Format
          </Label>
          {profileLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
              <SelectTrigger id="date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd-MM-yyyy">DD-MM-YYYY</SelectItem>
                <SelectItem value="MM-dd-yyyy">MM-DD-YYYY</SelectItem>
                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || profileLoading}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                         */
/* ------------------------------------------------------------------ */

export default function Settings() {
  return (
    <div className="mx-auto max-w-2xl">
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

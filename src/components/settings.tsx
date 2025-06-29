
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ProfileSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle>Profile</CardTitle>
      <CardDescription>Manage your public profile information.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
            <AvatarImage src="https://placehold.co/80x80.png" alt="User avatar" data-ai-hint="profile picture" />
            <AvatarFallback>SN</AvatarFallback>
        </Avatar>
        <Button variant="outline">Change Photo</Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" defaultValue="Shishir Nikam" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" defaultValue="shishir.nikam@email.com" />
      </div>
      <Button>Save Changes</Button>
    </CardContent>
  </Card>
);

const PreferencesSettings = () => (
    <Card>
    <CardHeader>
      <CardTitle>Preferences</CardTitle>
      <CardDescription>Customize the application to your liking.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label>Theme</Label>
        <ThemeToggle />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Default Currency</Label>
        <Select defaultValue="INR">
          <SelectTrigger id="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
            <SelectItem value="USD">US Dollar ($)</SelectItem>
            <SelectItem value="EUR">Euro (€)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select defaultValue="en">
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="date-format">Date Format</Label>
        <Select defaultValue="dd-mm-yyyy">
          <SelectTrigger id="date-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
            <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
            <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button>Save Preferences</Button>
    </CardContent>
  </Card>
);


export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto">
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

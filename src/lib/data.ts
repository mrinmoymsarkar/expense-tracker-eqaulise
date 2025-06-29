import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  Film,
  HeartPulse,
  type LucideIcon,
  Plane,
} from "lucide-react";

export const categories: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "Food", label: "Food & Dining", icon: Utensils },
  { value: "Shopping", label: "Shopping", icon: ShoppingCart },
  { value: "Transport", label: "Transportation", icon: Car },
  { value: "Housing", label: "Housing & Utilities", icon: Home },
  { value: "Entertainment", label: "Entertainment", icon: Film },
  { value: "Health", label: "Health & Wellness", icon: HeartPulse },
  { value: "Travel", label: "Travel", icon: Plane },
];

export const getCategoryIcon = (
  categoryValue: string
) => {
  const category = categories.find((c) => c.value === categoryValue);
  const Icon = category ? category.icon : Utensils;
  return Icon;
};

export const expenseData = [
  {
    id: "1",
    description: "Team Lunch at Chili's",
    category: "Food",
    date: "2024-07-22",
    amount: 3250.0,
    group: "Office Buddies",
  },
  {
    id: "2",
    description: "Weekend movie - Fighter",
    category: "Entertainment",
    date: "2024-07-21",
    amount: 1200.0,
    group: "Friends Hangout",
  },
  {
    id: "3",
    description: "Grocery shopping",
    category: "Shopping",
    date: "2024-07-20",
    amount: 2500.5,
    group: "Flatmates",
  },
  {
    id: "4",
    description: "Goa Trip Flights",
    category: "Travel",
    date: "2024-07-18",
    amount: 18500.0,
    group: "Goa Trip '24",
  },
  {
    id: "5",
    description: "Ola ride to office",
    category: "Transport",
    date: "2024-07-17",
    amount: 450.0,
    group: "Office Buddies",
  },
  {
    id: "6",
    description: "Electricity Bill",
    category: "Housing",
    date: "2024-07-15",
    amount: 1800.0,
    group: "Flatmates",
  },
];

export const groupData = [
  {
    id: "1",
    name: "Goa Trip '24",
    imageUrl: "https://placehold.co/400x200.png",
    imageHint: "beach landscape",
    totalExpenses: 25000,
    members: [
      { initials: "RK", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "SN", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "AV", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "PG", avatarUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "2",
    name: "Office Buddies",
    imageUrl: "https://placehold.co/400x200.png",
    imageHint: "office building",
    totalExpenses: 7800,
    members: [
      { initials: "SN", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "AM", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "KR", avatarUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "3",
    name: "Flatmates",
    imageUrl: "https://placehold.co/400x200.png",
    imageHint: "apartment interior",
    totalExpenses: 9200,
    members: [
      { initials: "SN", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "VP", avatarUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "4",
    name: "Friends Hangout",
    imageUrl: "https://placehold.co/400x200.png",
    imageHint: "cafe interior",
    totalExpenses: 4300,
    members: [
      { initials: "SN", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "RK", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "AV", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "SG", avatarUrl: "https://placehold.co/40x40.png" },
      { initials: "MJ", avatarUrl: "https://placehold.co/40x40.png" },
    ],
  },
];

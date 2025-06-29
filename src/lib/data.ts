import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  Film,
  HeartPulse,
  type LucideIcon,
  Plane,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";

export const categories: {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    value: "Food",
    label: "Food & Dining",
    icon: Utensils,
    color:
      "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  },
  {
    value: "Shopping",
    label: "Shopping",
    icon: ShoppingCart,
    color:
      "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  },
  {
    value: "Transport",
    label: "Transportation",
    icon: Car,
    color:
      "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  },
  {
    value: "Housing",
    label: "Housing & Utilities",
    icon: Home,
    color:
      "border-transparent bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300",
  },
  {
    value: "Entertainment",
    label: "Entertainment",
    icon: Film,
    color: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  {
    value: "Health",
    label: "Health & Wellness",
    icon: HeartPulse,
    color: "border-transparent bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
  },
  {
    value: "Travel",
    label: "Travel",
    icon: Plane,
    color: "border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  },
];

export const getCategory = (categoryValue: string) => {
  const category = categories.find((c) => c.value === categoryValue);
  return category || categories[0];
};

export const paymentMethods: {
  value: string;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    value: "Card",
    label: "Card",
    icon: CreditCard,
  },
  {
    value: "UPI",
    label: "UPI",
    icon: Smartphone,
  },
  {
    value: "Cash",
    label: "Cash",
    icon: Wallet,
  },
];

export const getPaymentMethod = (paymentMethodValue: string) => {
  const method = paymentMethods.find((m) => m.value === paymentMethodValue);
  return method || paymentMethods[0];
};


export const expenseData = [
  {
    id: "1",
    description: "Team Lunch at Chili's",
    category: "Food",
    date: "2024-07-22",
    amount: 3250.0,
    group: "Office Buddies",
    paymentMethod: "Card",
  },
  {
    id: "2",
    description: "Weekend movie - Fighter",
    category: "Entertainment",
    date: "2024-07-21",
    amount: 1200.0,
    group: "Friends Hangout",
    paymentMethod: "UPI",
  },
  {
    id: "3",
    description: "Grocery shopping",
    category: "Shopping",
    date: "2024-07-20",
    amount: 2500.5,
    group: "Flatmates",
    paymentMethod: "Card",
  },
  {
    id: "4",
    description: "Goa Trip Flights",
    category: "Travel",
    date: "2024-07-18",
    amount: 18500.0,
    group: "Goa Trip '24",
    paymentMethod: "Card",
  },
  {
    id: "5",
    description: "Ola ride to office",
    category: "Transport",
    date: "2024-07-17",
    amount: 450.0,
    group: "Office Buddies",
    paymentMethod: "UPI",
  },
  {
    id: "6",
    description: "Electricity Bill",
    category: "Housing",
    date: "2024-07-15",
    amount: 1800.0,
    group: "Flatmates",
    paymentMethod: "UPI",
  },
  {
    id: "7",
    description: "June Groceries",
    category: "Shopping",
    date: "2024-06-15",
    amount: 4200.0,
    group: "Flatmates",
    paymentMethod: "Cash",
  },
  {
    id: "8",
    description: "Concert Tickets",
    category: "Entertainment",
    date: "2024-06-10",
    amount: 3000.0,
    group: "Friends Hangout",
    paymentMethod: "UPI",
  },
  {
    id: "9",
    description: "Train to Mumbai",
    category: "Travel",
    date: "2024-06-05",
    amount: 1500.0,
    group: "",
    paymentMethod: "Card",
  },
  {
    id: "10",
    description: "Doctor's visit",
    category: "Health",
    date: "2024-05-25",
    amount: 800.0,
    group: "",
    paymentMethod: "Cash",
  },
  {
    id: "11",
    description: "New headphones",
    category: "Shopping",
    date: "2024-05-12",
    amount: 5500.0,
    group: "",
    paymentMethod: "Card",
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

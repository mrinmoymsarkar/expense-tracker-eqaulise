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



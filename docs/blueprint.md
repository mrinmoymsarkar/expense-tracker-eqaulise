# **App Name**: Equalize

## Core Features:

- User Profile Management: Allow users to create and manage their profile, setting preferences like default currency, language (English or Hindi), date format, and number format.
- Expense Tracking: Enable users to input, categorize (using a pre-defined list tailored for the Indian market), and track expenses, with options to upload receipts and add notes. Expenses can be marked with the location.
- Smart Split Suggestions: Enable the application to suggest a splitting method using generative AI, and customize amounts per person or split by percentage. The LLM will use a tool to reason about incorporating the best split suggestions.
- Group Expense Management: Allow users to organize expenses into groups, manage group members, and view group-level summaries and expense history.
- Analytics Dashboard: Provide an overview of spending habits with charts and summaries.
- Theme management: The app offers users comprehensive theming options including light, dark, and auto modes.  It can be persisted locally.
- Offline Mode: Allow users to make edits while offline and sync later when the internet is available

## Style Guidelines:

- Primary color: HSL(220, 70%, 40%) - A deep, saturated blue to convey trust and stability. Hex: #2962FF
- Background color: HSL(220, 20%, 98%) - A very light blue for a clean, calming backdrop. Hex: #F7FAFC
- Accent color: HSL(190, 70%, 40%) - A contrasting teal, used sparingly for interactive elements and calls to action. Hex: #29D1FF
- Body: 'PT Sans' - A humanist sans-serif font providing a modern yet warm feel, used throughout the application for readability.
- Headings: 'Space Grotesk' - A sans-serif font giving a computerized and techy feeling. To be paired with PT Sans for the body
- Use clear and recognizable icons from Lucide React or Heroicons to represent expense categories and actions, ensuring clarity and ease of use.
- Implement a responsive layout that adapts to different screen sizes, utilizing a mobile-first approach.  A sidebar for navigation on desktop and bottom navigation on mobile are used.
- Employ subtle animations using Framer Motion for page transitions, modal appearances, and user interactions, enhancing the user experience without being distracting.
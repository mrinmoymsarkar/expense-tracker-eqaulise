# Equalize: Split Expenses, Not Friendships

Equalize is a modern, AI-powered expense-splitting application designed to make managing shared costs with friends, family, and colleagues simple and fair. Built with Next.js, Genkit, and ShadCN UI, it offers an intuitive and seamless user experience.

## Key Features

- **AI-Powered Receipt Scanning:** Automatically extract expense details like description, amount, and category just by uploading a photo of a receipt.
- **Smart Split Suggestions:** Get intelligent recommendations on the fairest way to split a bill based on the expense description and number of people involved.
- **Intuitive Expense Tracking:** Add, view, and manage your expenses with a clean and easy-to-use interface, complete with details like category, payment method, and notes.
- **Group Management:** Create groups for different circles (e.g., trips, flatmates, office colleagues) to track shared expenses and settle balances easily.
- **Insightful Dashboard:** Visualize your spending habits with interactive charts, viewing expenses broken down by category or tracked monthly.
- **Data Export:** Export your complete expense history to a CSV file for personal archiving or further analysis.
- **User Authentication:** Secure sign-up and login with Email/Password or Google.
- **Responsive Design:** A seamless experience across desktop and mobile devices.
- **Customizable Interface:** Switch between light and dark modes to suit your preference.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Firebase Setup

To run this project, you will need to create a Firebase project and configure the authentication methods.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click on **Add project**, give it a name (e.g., "Equalize App"), and continue. You can disable Google Analytics for this project to simplify setup.

2.  **Create a Web App:**
    *   Once your project is created, click the web icon (`</>`) on the project dashboard to register a new web application.
    *   Give your app a nickname (e.g., "Equalize Web") and click **Register app**.

3.  **Get Firebase Config Keys:**
    *   After registering, Firebase will display your `firebaseConfig` object. Keep this page open; you will need these keys.

4.  **Enable Authentication Methods:**
    *   In the Firebase Console, go to the **Build** section in the left-hand menu and click on **Authentication**.
    *   Click **Get started**.
    *   On the **Sign-in method** tab, enable the **Email/Password** provider.
    *   Enable the **Google** provider and set your support email.

5.  **Configure Environment Variables:**
    *   In the root of this project, you will find a file named `.env.example`.
    *   Create a copy of this file and rename it to `.env`.
    *   Copy the keys from the `firebaseConfig` object you got in step 3 and paste them into your `.env` file. It should look like this:

    ```bash
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

### Installation & Running Locally

1.  **Clone the repository:**
    ```sh
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running on [http://localhost:9002](http://localhost:9002).

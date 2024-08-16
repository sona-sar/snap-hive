# Hive - Snapchat Prototype Feature 🐝

Hive is a prototype feature created for the Snapchat app, which can be found on the Maps screen. It was developed by our team of Snap Academy Scholars for the year 2024, consisting of 2 engineers, 2 designers, and 3 marketers.

## Getting Started

Follow these steps to set up and run the Hive project on your local machine.

### Prerequisites

- Node.js and npm (or yarn)
- Visual Studio Code (or any preferred code editor)
- Expo CLI
- Supabase account
- Google Maps API key

### Installation

1. Clone the repository
   `git clone https://github.com/sona-sar/snap-hive.git`
2. Open the project in Visual Studio Code
3. Install dependencies
   `npm install` or `yarn install`
4. Create a `.env.local` file in the root directory with the following content:
```cmd

EXPO_PUBLIC_SUPABASE_URL="Your Supabase URL"
EXPO_PUBLIC_SUPABASE_ANON_KEY="Your Supabase Key"
EXPO_PUBLIC_GOOGLE_MAPS_API="Your Google Maps API Key"

```
### Supabase Setup
1. Create a new project in Supabase
2. Note the URL and anon key for your Supabase project (to be used in the `.env.local` file)
3. Go to the "Table Editor" in your Supabase project
4. Upload the provided reference table file to create the necessary database structure
[Download](./pins_rows.csv)

### Running the App

1. Start the Expo development server: `yarn expo start`
2. Open the app on your phone using the Expo Go app or your preferred method

https://github.com/user-attachments/assets/ba27882f-81ed-4160-8b19-b0ba4566b1e8



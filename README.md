# FortyWell Mobile App 🌿

A personalized holistic wellness and hormonal health companion mobile application built with React Native and Expo.

## Features

- **Personalized Assessment & Quiz**: Deep-dive questions to assess hormonal wellness, cortisol patterns, and daily vitality.
- **Dynamic Plan Generation**: Personalized recommendations, daily rituals, supplement protocol, and nutrition guidance.
- **Supabase Integration**: Cloud sync for user profiles, assessment scores, and customized plans.
- **Interactive UI**: Built with custom typography, haptic feedback, fluid animations, and high aesthetic standards.

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Backend / Database**: Supabase
- **Icons & Styling**: Lucide React Native, Custom Typography (Martian Mono, Playfair Display, Work Sans)
- **Animation**: React Native Reanimated & Haptics

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (or an emulator/simulator)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gazda403/Fortywell-app.git
   cd Fortywell-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase URL and Anon Key.

4. Start the development server:
   ```bash
   npm start
   ```

5. Open the project:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

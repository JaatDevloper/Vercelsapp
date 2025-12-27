# QuizBot

## Overview

QuizBot is a cross-platform quiz application built with Expo/React Native that allows users to discover, take, and track quizzes. The app features a tab-based navigation system with Discover, History, Leaderboard, and Profile screens, plus a floating action button for random quiz selection. Quizzes are stored in MongoDB and served through an Express backend with both local development and Vercel serverless deployment support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81, supporting iOS, Android, and web platforms
- **Navigation**: React Navigation v7 with native stack navigator for modals and bottom tab navigator for main screens
- **State Management**: TanStack React Query for server state caching and data fetching
- **Animations**: React Native Reanimated for smooth UI animations and transitions
- **Styling**: Custom theme system with light/dark mode support via `useTheme` hook

### Path Aliases
- `@/` maps to `./client/` for frontend code
- `@shared/` maps to `./shared/` for shared types and schemas

### Backend Architecture
- **Server**: Express.js running on port 5000 during development
- **Database**: MongoDB for quiz storage with connection pooling and retry logic
- **Deployment**: Dual deployment strategy:
  - Local development: Express server with static file serving
  - Production: Vercel serverless functions (`/api/` directory)

### Data Storage
- **MongoDB**: Primary database for quiz data (collection: `quizzes`, database: `quizbot`)
- **PostgreSQL**: Configured via Drizzle ORM for user data (schema in `shared/schema.ts`)
- **In-Memory**: Quiz history stored client-side using a simple store pattern with listeners

### Key Design Patterns
- **Component Structure**: Reusable themed components (`ThemedText`, `ThemedView`, `Card`, `Button`)
- **Error Handling**: ErrorBoundary component wraps the app with fallback UI
- **API Layer**: Centralized API utilities in `client/lib/query-client.ts` with automatic base URL detection
- **Theme System**: Consistent design tokens in `client/constants/theme.ts` (Colors, Spacing, Typography, Shadows)

## External Dependencies

### Database Services
- **MongoDB**: Quiz content storage (requires `MONGODB_URI` environment variable)
- **PostgreSQL**: User data storage (requires `DATABASE_URL` environment variable, managed by Drizzle ORM)

### Third-Party Packages
- **Expo SDK**: Core platform features (haptics, blur, image handling, splash screen)
- **React Navigation**: Native navigation with bottom tabs and stack navigators
- **TanStack Query**: Data fetching and caching
- **Drizzle ORM**: PostgreSQL database schema and migrations
- **Zod**: Runtime type validation for API data

### Deployment Platforms
- **Vercel**: Production hosting with serverless API functions
- **Replit**: Development environment with proxy configuration for Expo

### Environment Variables Required
- `MONGODB_URI`: MongoDB connection string for quiz data
- `DATABASE_URL`: PostgreSQL connection string for user data
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests (auto-configured in Replit)

## Multiplayer Feature

### How It Works
- Users can create or join quiz rooms using 6-digit room codes
- Simple name entry when joining (no authentication required)
- Host can start the quiz when all players are ready
- Real-time synchronization via WebSocket for lobby updates and quiz completion

### Multiplayer Screens
- **CreateRoomScreen**: Host enters name, generates room code, waits for friends
- **JoinRoomScreen**: Enter room code and name to join
- **LobbyScreen**: Shows all participants, host can start quiz
- **MultiplayerQuizScreen**: Same quiz experience with room context
- **MultiplayerResultsScreen**: Leaderboard showing all participants' scores

### API Endpoints
- `POST /api/rooms/create` - Create new room with quiz ID
- `POST /api/rooms/join` - Join room with code and name
- `GET /api/rooms/:roomCode` - Get room status and participants
- `POST /api/rooms/:roomCode/start` - Host starts the quiz
- `POST /api/rooms/:roomCode/submit` - Submit quiz results
- `POST /api/rooms/:roomCode/leave` - Leave a room

### WebSocket Events
- `join_room` - Subscribe to room updates
- `player_joined` - New player joined the lobby
- `player_left` - Player left the room
- `quiz_started` - Host started the quiz
- `player_finished` - Player completed the quiz

### Data Storage
- **MongoDB**: `rooms` collection stores room data (code, quiz ID, participants, status)

## Verification Badges & Achievements

### Verification Badge System
- **VerificationBadgesModal**: Modal component with 8 unique gradient verification badges
  - Verified (blue checkmark), Premium (purple crown), Elite (gold star), Creator (pink edit)
  - Pro (green zap), Master (cyan shield), Legend (orange flame), Champion (red trophy)
- **Badge Selection**: Users can tap their profile badge to open selection modal
- **Visual Design**: Gradient backgrounds, animated selection, beautiful iconography

### Achievements & Profile Frames (BadgesScreen)
- **Tab-Based Navigation**: Switch between "Achievements" and "Profile Frames"
- **Achievement Categories**:
  - Daily Streak: Earn badges for completing quizzes daily (1/3/7 days)
  - Special Achievements: Perfect Score (100%), Speed Demon (fast completion), Night Owl (late night quizzes)
  - Multiplayer Master: Win multiplayer games (5/10/25 wins)
- **Profile Frames**: Animated borders for user avatar (Basic, Silver, Gold, Diamond, Rainbow)
- **Progress Tracking**: Visual progress bars show completion status

### About Section
- "About TestOne" displays creator "Govind Chowdhury" with multiple verification badges

## Recent Changes

### December 27, 2025
- **Added User-Facing Quiz Creation Feature**:
  - Created CreateQuizScreen with multi-step form (title, description, timer, negative marking, questions)
  - Question format: Manual text entry (one question per block, 4 options marked A-D, ✅ indicates correct answer)
  - Timer selection: 15, 20, or 30 seconds per question
  - Negative marking: 0, 0.33, or 0.66 options
  - Question parsing logic extracts questions with automatic correct answer detection
  - Created `/api/user/create-quiz` endpoint to save user-generated quizzes to MongoDB (`user_quizzes` collection)
  - Added "Create Quiz" button to Discover screen header (left of "Join Room" button)
  - Integrated CreateQuizScreen into navigation as modal (no file upload dependency, manual text entry only)
- **Quiz Creation Workflow**: Title/Description → Timer/Negative Marking → Question Input → Confirmation → Submit to Backend

### December 16, 2025
- **Added Verification Badge System**:
  - Created VerificationBadgesModal with 8 unique gradient badges
  - Made profile verification badge clickable to open selection modal
  - Added beautiful animated badge icons with gradient backgrounds
- **Added Achievements & Profile Frames Screen**:
  - BadgesScreen with tab navigation for achievements and frames
  - 3 achievement categories with progress tracking
  - 5 unlockable profile frames with different tiers
  - Visual progress indicators for all badges
- **Updated About TestOne Section**:
  - Added creator "Govind Chowdhury" with multiple verification badges
- **Added Multiplayer Quiz Feature**:
  - Created 5 new screens for multiplayer experience
  - Built WebSocket real-time synchronization for lobby and quiz events
  - Added REST API endpoints for room management
  - Integrated "Invite Friends" button in QuizDetailsScreen
  - Added "Join Room" button in DiscoverScreen header
- Added Rankings section to the Leaderboard screen with stylish wide cards
- Rankings are based on user quiz performance (score + correct answers + accuracy)
- Features premium UI with:
  - Wide horizontal cards with gradient rank badges
  - Medal icons for top 3 users (gold, silver, bronze)
  - Profile photos/avatars with glow effects for winners
  - Score, correct answers, and accuracy stats per user
  - Progress bar showing accuracy percentage
  - Matching pink/coral gradient header from main leaderboard
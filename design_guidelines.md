# Advanced Quiz App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app needs user accounts to track quiz history and progress.

**Implementation:**
- Use SSO (Apple Sign-In for iOS, Google Sign-In for Android)
- Mock auth flow in prototype using local state
- Include login/signup screens with:
  - Large app logo/branding at top
  - SSO buttons with provider logos
  - Privacy policy & terms of service links (placeholder URLs)
- Profile screen must include:
  - User avatar (generate 3 unique academic/learning-themed preset avatars)
  - Display name
  - Total quizzes completed stat
  - Average score stat
  - Log out button
  - Delete account (nested under Settings > Account > Delete)

### Navigation Structure
**Tab Navigation** (4 tabs + floating action):
1. **Discover** (Home) - Browse all quizzes with categories and search
2. **History** - Past quiz attempts and scores
3. **Profile** - User stats and settings
4. **Floating Action Button** - "Take Random Quiz" positioned bottom-center

### Information Architecture

**Tab 1: Discover Screen**
- Purpose: Browse and search 914+ quizzes from MongoDB
- Layout:
  - Custom transparent header with app logo (left) and filter icon (right)
  - Search bar below header with debounced search
  - Horizontal scrolling category chips
  - Scrollable grid of quiz cards (2 columns)
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- Components:
  - Search input with icon
  - Category filter chips (All, Science, History, Math, etc.)
  - Quiz cards showing: title, category badge, question count, difficulty level, estimated time
  - Pull-to-refresh functionality
  - Loading skeleton cards while fetching

**Tab 2: History Screen**
- Purpose: View past quiz attempts with scores
- Layout:
  - Default navigation header "Quiz History"
  - Scrollable list of completed quiz cards
  - Top inset: Spacing.xl (default header)
  - Bottom inset: tabBarHeight + Spacing.xl
- Components:
  - History cards showing: quiz title, score percentage, date completed, review button
  - Empty state with encouraging message and "Take a Quiz" CTA
  - Sort/filter options (by date, by score)

**Tab 3: Profile Screen**
- Purpose: User stats, achievements, and settings
- Layout:
  - Custom transparent header with settings icon (right)
  - Scrollable content area
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- Components:
  - Avatar and display name at top
  - Stats cards grid (Total Quizzes, Avg Score, Current Streak, Best Category)
  - Settings list items
  - Logout button at bottom

**Modal: Quiz Taking Screen**
- Purpose: Take quiz with question-by-question flow
- Layout:
  - Custom header with progress bar, timer, and close button
  - Non-scrollable content area with current question
  - Fixed footer with navigation buttons
- Components:
  - Linear progress indicator showing question X of Y
  - Timer (if timed mode)
  - Question text card with large readable typography
  - Answer option buttons (radio-style for multiple choice)
  - "Previous" and "Next" buttons in footer
  - "Submit Quiz" on final question

**Modal: Results Screen**
- Purpose: Show quiz score and detailed breakdown
- Layout:
  - Custom header with "Quiz Results" title and close button
  - Scrollable content area
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- Components:
  - Large circular score display with animation
  - Performance message (Great Job! / Keep Practicing!)
  - Time taken and accuracy stats
  - Expandable list of all questions with user's answers and correct answers
  - "Retake Quiz" and "View More Quizzes" buttons

## Design System

### Color Palette
**Primary:** Deep Purple (#6366F1) - Modern, trustworthy, learning-focused
**Secondary:** Vibrant Teal (#06B6D4) - Accent for correct answers and success
**Error/Incorrect:** Coral Red (#EF4444)
**Background:** Clean White (#FFFFFF)
**Surface:** Light Gray (#F9FAFB)
**Text Primary:** Dark Gray (#1F2937)
**Text Secondary:** Medium Gray (#6B7280)
**Border:** Light Border (#E5E7EB)

**Quiz Difficulty Colors:**
- Easy: Light Green (#10B981)
- Medium: Amber (#F59E0B)
- Hard: Deep Orange (#F97316)

### Typography
- **Headings (Quiz Title, Screen Headers):** System Bold, 24-28pt
- **Body (Questions):** System Regular, 18pt, line-height 1.6
- **Answer Options:** System Medium, 16pt
- **Metadata (Category, Time):** System Regular, 14pt
- **Stats/Numbers:** System Bold, 32-48pt

### Visual Design

**Quiz Cards (Discover Screen):**
- White background with subtle shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 8)
- Rounded corners (12px)
- Category badge in top-left with category-specific color
- Difficulty indicator (dot with color) in top-right
- Clear hierarchy: Title > Question count > Estimated time

**Answer Option Buttons:**
- Large touch targets (min 56px height)
- Rounded borders (8px)
- Default state: White background, primary border
- Selected state: Primary background, white text
- Correct (after submission): Secondary background with checkmark icon
- Incorrect (after submission): Error background with X icon
- Smooth transition animations (200ms)

**Progress Indicators:**
- Linear progress bar at top of quiz screen (primary color)
- Circular progress for quiz completion stats
- Animated number counters for score reveals

**Floating Action Button:**
- Primary gradient background (purple to teal)
- White icon (shuffle/random symbol)
- Drop shadow specifications:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Positioned 16px above tab bar, centered

### Interaction Design
- All touchable elements have opacity feedback (activeOpacity: 0.7)
- Answer selections have scale animation (0.98) on press
- Screen transitions use slide animations
- Question transitions within quiz use fade + slide
- Pull-to-refresh on Discover and History screens
- Haptic feedback on answer selection and quiz submission
- Swipe gestures for next/previous questions (optional)

### Accessibility
- Minimum touch target size: 44x44 points
- Color contrast ratio 4.5:1 for all text
- Support for system font scaling (up to 200%)
- Screen reader labels for all interactive elements
- Focus indicators for keyboard navigation
- Alternative text for icons
- Error states clearly communicated with text, not just color

### Critical Assets
1. **App Logo** - Clean, minimal icon representing knowledge/learning (book or lightbulb concept)
2. **User Avatars (3 presets)** - Academic themed:
   - Graduation cap with books
   - Brain with sparkles
   - Trophy with star
3. **Empty State Illustrations:**
   - No quizzes found (magnifying glass with question mark)
   - No history yet (clipboard with checkmark)
4. **Category Icons** - Simple line icons for each quiz category (science beaker, history scroll, math symbols, etc.)

### Loading & Error States
- Skeleton screens for quiz loading (shimmer effect)
- Error messages in friendly, actionable language
- Retry buttons for failed MongoDB connections
- Offline mode indicator with cached quiz access
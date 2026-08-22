# InstaFame - Full-Stack Social Profile Viewer Application

InstaFame is a Next.js full-stack web application built with React, Tailwind CSS, NextAuth.js, and custom API routes. It features **pixel-perfect UI replicas** of both **Instagram** and **Facebook** user profiles with debounced search, responsive layouts, data fallbacks, and error handling.

---

## ✨ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Framer Motion
- **Authentication**: NextAuth.js (Google OAuth & Demo Guest Mode)
- **Backend**: Next.js API Routes (`/api/instagram`, `/api/facebook`)
- **Styling**: Tailwind CSS with custom brand design tokens (`#f09433`, `#bc1888`, `#1877F2`)

---

## 🚀 Key Features

### 1. Login Page
- Clean, minimal dark mode landing page design.
- **Sign in with Google** button integrated with NextAuth.
- **Continue as Guest Demo** button for instant one-click preview.

### 2. Dashboard
- Welcome banner displaying authenticated user's profile card.
- Interactive platform selection cards for **Instagram** and **Facebook**.
- Feature summary grid showcasing debounced search and cached responses.

### 3. Instagram Profile Viewer
- **Debounced Search**: 500ms input debouncing.
- **Preset Quick Chips**: Instant testing with `@natgeo`, `@nasa`, and error triggers.
- **Exact UI Replica**:
  - Circular avatar with story ring gradient.
  - Verified checkmark badge, username, and action buttons ("Follow", "Message").
  - Posts, Followers, and Following counters.
  - Full bio with line breaks and clickable external links.
  - Interactive Story Highlights with fullscreen story modal preview.
  - Tab bar: POSTS, REELS, SAVED, TAGGED.
  - 3-column post thumbnail grid with hover overlay displaying like and comment metrics.
  - Interactive Post Modal displaying high-res photos, likes, and comment stream.
- **Skeleton Loader**: Shimmer animation during API requests.

### 4. Facebook Profile Viewer
- **Debounced Search**: 500ms input debouncing.
- **Preset Quick Chips**: Instant testing with `@zuck` and `@markzuckerberg`.
- **Exact UI Replica**:
  - Full-width cover photo header with edit button.
  - Overlapping circular profile picture with camera edit icon.
  - Full name, verified checkmark, friend count, and action buttons ("Add Friend", "Message").
  - Profile navigation tabs (Posts, About, Friends, Photos, Videos).
  - **Two-Column Layout**:
    - **Left Sidebar**: Intro details (Workplace, Education, Lives in, From, Joined Date) + Featured Photos grid + Friends list summary.
    - **Right Main Feed**: "What's on your mind?" post creation simulation + Post stream with multi-reaction counters (Like, Heart, Care), comments list, and interactive like/comment toggles.
- **Skeleton Loader**: Shimmer animation for cover photo, avatar, and post feed.

---

## 🛠️ Environment Variables Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=instafame_secret_key_384729184719284712

# Google OAuth Credentials (Obtain from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Meta / Instagram & Facebook Credentials (Optional for Production Graph API)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## 📦 Local Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Sample Usernames for Testing

- **Instagram**:
  - `natgeo` (National Geographic official profile)
  - `nasa` (NASA official profile)
  - Any custom username (e.g. `tech_creator`) to trigger dynamic profile generation.
  - `notfound_user` to test "User not found" 404 error state.
  - `ratelimit_user` to test "Too many requests" 429 error state.

- **Facebook**:
  - `zuck` or `markzuckerberg` (Mark Zuckerberg official profile)
  - Any custom username to trigger dynamic Facebook profile generation.

---

## 🌐 Deploy to Vercel

1. Push your code to a GitHub / GitLab repository.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Add Environment Variables (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
4. Click **Deploy**.

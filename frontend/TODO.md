# Fitness & Nutrition App — Feature TODO List

This file tracks all planned features and visual mockups for your Vite (React) + FastAPI app.  
**Reference this list for priorities, requirements, and design notes.**

---

## ✅ Feature 1: Healthy Suggestions Page (`/suggestions`)

- User profile card (goal, diet, likes/dislikes)
- Suggested healthy recipe card (image, macros, tip)
- Two mock nearby restaurants (name, image, dish, distance, rating)
- **Static/mock data only**

---

## ✅ Feature 2: Ingredients + Recipe Generator (on `/suggestions`)

- List stored ingredients
- Form to add new ingredient (local state only)
- Suggest 1–3 recipes based on ingredients (simple matching)
- **Mock data, simulate “recipes you can make”**

---

## ✅ Feature 3: Security Page (`/security`)(DONE)

- List fake data stored about user (preferences, meals, goals)
- “Wipe My Data” button (clears local state / simulates deletion)
- Confirmation dialog before wiping
- **No real backend wipe**

---

## ✅ Feature 4: Live Workout Voice Assistant (`/voice-assistant`)

- Circular mic button starts voice flow (text-to-speech OR text simulation)
- Motivates and walks user through a 1–2 minute workout session
  - Example: “Warm up! March in place…”, “Keep it up!”, “Take a deep breath!”
- **Functional AI piece (basic state/timer/step array)**

---

## ✅ Feature 5: Camera Scanner (`/camera-scan`)

- **Workout Equipment Mode**
  - Fake camera preview area
  - “Scan” button
  - Show 2–3 detected items (e.g., dumbbells → suggested exercises)
- **Food Receipt Mode**
  - Mock receipt image or upload prompt
  - After "Scan", display 2–3 detected food items
  - Add those ingredients to local list (simulate state update)
- **Pure UI/UX mock, no real image processing**

---

## Design & Implementation Notes

- Use simple CSS (or Tailwind if available)
- Material You–inspired design (rounded corners, soft colors, modern fonts, padding)
- Static/mock data for everything unless specified
- Modular components/pages for each feature
- All features are mockups except the voice assistant (minimally functional)
- Focus on clean visuals, responsive design, and modularity

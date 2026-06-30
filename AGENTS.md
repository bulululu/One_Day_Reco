# AGENTS.md - OneDayReco Project Memory

## Product Direction
- OneDayReco is a lifestyle recommendation app that reduces decision cost by suggesting specific, executable activities for any place and time.
- The first screen should feel like a warm, niche personal lifestyle assistant, not a generic review/feed app.
- MBTI is a first-class design and recommendation input. Selecting or inferring MBTI must change theme colors, copy tone, companion identity, and visual assets.
- Recommendations must be specific enough to act on: place/content/game/movie name, time or duration, price/budget, source, rating or confidence where available, and a concrete next action.
- Do not fabricate realtime facts. If realtime APIs are unavailable, show fallback/source status clearly.

## Current Tech Stack
- Mobile frontend: React Native with Expo SDK 56 and TypeScript.
- Navigation: React Navigation native stack in `mobile/App.tsx`.
- State: Zustand with AsyncStorage persistence in `mobile/src/store/appStore.ts`.
- Styling: React Native `StyleSheet` plus existing Expo/React Native primitives. Do not introduce NativeWind or Expo Router unless the migration is explicitly requested.
- Backend: FastAPI service under `backend/`, used for recommendation, chat, auth, feedback, places, weather, movies, content, and activity APIs.
- Optional data client: Supabase client may live in `mobile/src/lib/supabase.ts` for future hosted auth/database features, but do not remove the existing FastAPI backend unless explicitly asked.
- Package manager: npm with `mobile/package-lock.json`.

## Directory Structure
- `mobile/src/screens`: app screens such as onboarding, auth, and main recommendation/chat surface.
- `mobile/src/components`: reusable React Native UI components.
- `mobile/src/data`: MBTI themes, personas, lifestyle design system, category visuals, and local UI metadata.
- `mobile/src/services`: frontend API clients.
- `mobile/src/store`: Zustand app state and persistence.
- `mobile/src/assets`: generated and static visual assets.
- `backend/app/routers`: FastAPI routers.
- `backend/services`: backend integrations and persistence helpers.
- `backend/agents`: recommendation agent logic.
- `scripts`: local verification scripts.
- `prototype`: HTML prototype reference, not the source of truth for the shipped app.

## Coding Guidelines
- Keep interactions simple and direct. Do not hide the core recommendation flow behind complex controls.
- Prefer existing code patterns over adding frameworks or broad rewrites.
- Use functional React components and TypeScript types.
- Keep UI text short enough for 390 x 844 mobile viewports.
- Preserve user or generated work unless explicitly asked to revert it.
- Add generated bitmap assets under `mobile/src/assets/` and reference them with static `require()` calls so Metro can bundle them.
- Keep advanced functionality such as screen-time triggers, mode switching, and activity catalogs behind secondary controls unless the user asks to foreground them.

## Verification
- Frontend type check: `cd mobile && npx tsc --noEmit`.
- Backend syntax check: use `PYTHONPYCACHEPREFIX=/private/tmp/onedayreco_pycache python3 -m py_compile ...` to avoid writing pycache outside the workspace.
- Run focused scripts after recommendation changes, especially:
  - `python3 scripts/check_action_urls.py`
  - `python3 scripts/check_recommendation_dedupe.py`
  - `python3 scripts/check_config_status.py`
- Visual QA must include at least 390 x 844 mobile viewport checks for onboarding and the main recommendation screen.

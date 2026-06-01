# Backend requirements — что нужно подключить по каждому компоненту

> Снимок состояния фронтенда на 2026-06-01. Цель документа: для каждой фичи UI
> зафиксировать **текущий источник данных**, **что фронт ожидает** и **что нужно
> сделать на бэке** (новые эндпоинты + форма ответа).
>
> Базовый контракт: все ответы в обёртке `{ "success": true, "data": ... }`
> (см. [`api-policy.md`](api-policy.md), [`api-inventory.md`](api-inventory.md)),
> ошибки — `{ "success": false, "error": { "code", "message" } }`, авторизация
> `Bearer` access-token (авто-refresh уже реализован в `lib/api/client.ts`).

## Легенда статусов

| Статус | Значение |
|--------|----------|
| ✅ подключено | данные идут с бэка через `lib/api/*` |
| 🟡 частично | часть полей с бэка, часть захардкожена |
| 🔴 мок | полностью локальные данные из `lib/store.ts`, эндпоинта нет |

---

## Сводная таблица

| # | Фича | Экран(ы) | Статус | Источник сейчас | Нужен эндпоинт |
|---|------|----------|--------|-----------------|----------------|
| 1 | Кампании / квесты / задачи | home, quest-roadmap, first-task, task-waiting | ✅ | `lib/api/campaigns,quests,tasks,subtasks` | — есть |
| 2 | Привычки (routines) | home, add-habit, create-habit-manual | ✅ | `lib/api/routines` | — есть |
| 3 | Персонаж (XP, уровень, характеристики) | profile, characteristics, progress | 🟡 | `GET /users/me/character` | дополнить (см. §3) |
| 4 | Онбординг-чат + генерация | ai-chat, goal-input, loading | ✅ | `lib/api/onboarding` | — есть |
| 5 | Фидбек по квесту | feedback | ✅ | `POST /quests/:id/feedback` | — есть |
| 6 | Друзья / лента активности | home → Social | 🔴 | `store.ts` friends | §6 |
| 7 | Совместные квесты (Collab) | 7 экранов `collab-*` | 🔴 | `store.ts` jointQuests | §7 |
| 8 | Streak-сводки | day-summary, mega-streak | 🔴 | `store.ts` streakSummaries | §8 |
| 9 | Активность за неделю | progress (бар-чарт) | 🔴 | `store.ts` weekActivity | §9 |
| 10 | Хитмап вклада (год) | progress | 🔴 | `Math.random()` | §10 |
| 11 | AI-рефлексия / инсайты | ai-reflection | 🔴 | хардкод в компоненте | §11 |
| 12 | Paywall / подписка / OAuth | paywall, auth | 🔴 | заглушки | §12 |
| 13 | Прочие захардкоженные числа | profile | 🔴 | литералы | §13 |

---

## 3. Персонаж — дополнить (🟡)

**Сейчас:** `GET /api/v1/users/me/character` отдаёт `xp / level / levelProgressPercent /
currentLevelName / nextLevelXp`, маппер `lib/mappers/character-mapper.ts` патчит
`UserProgress`. Но поля **`thisWeek` / `lastWeek`** у характеристик и **`megaStreak`**
берутся из `initialState` (`lib/store.ts:92-104`) и не обновляются с сервера.

**Фронт ожидает** (`lib/types.ts` → `Characteristic`, `UserProgress`):
```ts
characteristic: { key, name, current, max, thisWeek, lastWeek }
userProgress:   { xp, level, megaStreak, levelProgressPercent, nextLevelXp, ... }
```

**Что сделать на бэке:**
- В `GetCharacterResponse` добавить по каждой характеристике недельные приросты:
  `this_week`, `last_week` (число XP/очков за текущую и прошлую неделю).
- Добавить `mega_streak` (текущий сквозной стрик пользователя) в ответ персонажа
  либо отдельным полем в `data`.

**Замечание о консистентности:** во фронте `addXp` пересчитывает уровень локально как
`Math.floor(xp/100)+1` (`app-provider.tsx:122-135`). После любого завершения задачи
нужно доверять серверному `level/levelProgressPercent` (рефетч `GET .../character`),
иначе UI расходится с бэком. Рекомендуется убрать локальную формулу уровня.

---

## 6. Друзья / лента активности (🔴)

**Сейчас:** массив `friends` (Alex, Maya, Sam, Jordan) захардкожен в
`lib/store.ts:106-111`. Кнопки «Cheer» / «Challenge» меняют только локальный стейт.
Экран: `home-screen.tsx` → `SocialTab`, `ProfileTab`.

**Фронт ожидает** (`lib/types.ts` → `FriendActivity`):
```ts
{ id, name, avatar, action, questLabel, characteristic, timeAgo }
```

**Что сделать на бэке (новые эндпоинты):**
| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/social/friends` | список друзей пользователя |
| `GET` | `/api/v1/social/feed` | лента активности друзей (пагинация `?cursor=&limit=`) |
| `POST` | `/api/v1/social/friends/:userId/cheer` | реакция «подбодрить» на активность |
| `POST` | `/api/v1/social/friends/:userId/challenge` | вызвать на joint-quest (см. §7) |
| `POST` | `/api/v1/social/friends` | добавить друга (по коду/нику/email) |

**Ответ feed** (предложение):
```json
{ "success": true, "data": {
  "items": [
    { "id": "...", "user": { "id": "...", "name": "Alex", "avatar": "A" },
      "action": "Completed morning run", "quest_label": "Get Fit",
      "characteristic": "Strength", "created_at": "2026-06-01T09:12:00Z" }
  ],
  "next_cursor": null
}}
```
> `timeAgo` фронт может считать сам из `created_at` (добавить `date-fns`/хелпер).

**Решение продукта:** если соц-фича вне ближайшего скоупа — временно скрыть вкладку
Social и `friends`-блоки, чтобы не показывать пользователю фейковые данные.

---

## 7. Совместные квесты (Collab) (🔴)

**Сейчас:** `jointQuests` целиком захардкожен (`lib/store.ts:127-160`). Все 7 экранов
работают только на локальном стейте:
`collab-quest-settings`, `collab-invite`, `collab-impact-input`,
`collab-friend-status`, `collab-quest-failure`, `collab-celebration`,
`collab-final-results`. **На бэке эндпоинтов для collab нет вообще.**

**Фронт ожидает** (`lib/types.ts` → `JointQuest`, `CollabPlayer`):
```ts
JointQuest:  { id, title, description, deadline, daysLeft, status, player1, player2 }
CollabPlayer:{ id, name, avatar, progress, totalTasks, rankPoints, streak,
               failedTasks, impactScore, roadmapPreview[] }
```

**Что сделать на бэке (новый модуль):**
| Метод | Путь | Назначение |
|-------|------|------------|
| `POST` | `/api/v1/joint-quests` | создать совместный квест (title, deadline, цель) |
| `POST` | `/api/v1/joint-quests/:id/invite` | пригласить друга (→ `collab-invite`) |
| `POST` | `/api/v1/joint-quests/:id/accept` | принять приглашение |
| `GET` | `/api/v1/joint-quests` | список активных/завершённых |
| `GET` | `/api/v1/joint-quests/:id` | детали + оба игрока (`collab-friend-status`) |
| `POST` | `/api/v1/joint-quests/:id/impact` | внести impact-значение (`collab-impact-input`) |
| `GET` | `/api/v1/joint-quests/:id/results` | финальные результаты (`collab-final-results`) |

**Замечание:** `deadline` сейчас строка `"Mar 30, 2026"`, `daysLeft` — число. Лучше
отдавать `deadline` в ISO (`2026-03-30`) и считать `daysLeft` на фронте.

---

## 8. Streak-сводки (🔴)

**Сейчас:** `streakSummaries` захардкожен (`lib/store.ts:116-122`). Экраны:
`day-summary`, `mega-streak` (reset/success).

**Фронт ожидает** (`lib/types.ts` → `StreakSummary`):
```ts
{ name, survived, previousStreak }
```

**Что сделать на бэке:**
| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/users/me/streaks/summary?date=YYYY-MM-DD` | по каждой привычке/квесту: выжил ли стрик за день и предыдущая длина |

**Ответ:**
```json
{ "success": true, "data": { "items": [
  { "name": "Morning meditation", "survived": true, "previous_streak": 7 }
]}}
```
> Данные выводимы из существующих routine-completions — отдельная таблица не нужна,
> достаточно агрегата по дате.

---

## 9. Активность за неделю (🔴)

**Сейчас:** `weekActivity: [false,false,false,true,true,false,false]`
(`lib/store.ts:90`). Экран: `home-screen.tsx` → `ProgressTab` («This Week» бар-чарт).

**Что сделать на бэке:**
| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/users/me/activity/week?week_start=YYYY-MM-DD` | булев массив активности по 7 дням (Пн→Вс) |

**Ответ:** `{ "success": true, "data": { "days": [false,false,false,true,true,false,false] } }`
> Можно объединить с §10 (один activity-эндпоинт с разной грануляцией).

---

## 10. Хитмап вклада за год (🔴)

**Сейчас:** генерируется через `Math.random()` при каждом рендере
(`home-screen.tsx:233-251`, `generateGitHubHeatmap`). Это чистая декорация, не данные.

**Что сделать на бэке:**
| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/users/me/activity/heatmap?from=YYYY-MM-DD&to=YYYY-MM-DD` | по каждому дню — уровень активности 0..4 (или сырое число завершений) |

**Ответ:**
```json
{ "success": true, "data": { "days": [
  { "date": "2025-06-02", "count": 3, "level": 2 }
]}}
```
> `level` (0–4) бэк может посчитать сам по квантилям, либо фронт по `count`.

---

## 11. AI-рефлексия и инсайты (🔴)

**Сейчас:** 3 карточки инсайтов (`INSIGHT_CARDS`) — захардкоженные тексты
(`ai-reflection.tsx:15-40`). Поле рефлексии (`textarea`) **никуда не отправляется** —
только `setSubmitted(true)` (`ai-reflection.tsx:47`).

**Что сделать на бэке:**
| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/quests/:id/insights` | AI-инсайты по завершённому квесту (3 карточки) |
| `POST` | `/api/v1/quests/:id/reflection` | сохранить текст рефлексии пользователя |

**Ответ insights:**
```json
{ "success": true, "data": { "cards": [
  { "kind": "consistency", "title": "Consistency Pattern", "body": "..." }
]}}
```
> `kind` маппится во фронте на иконку/цвет (TrendingUp/Brain/Lightbulb).
> Тело инсайтов генерирует та же AI-подсистема, что и онбординг.

---

## 12. Paywall / подписка / OAuth (🔴)

**Сейчас:** кнопки «Continue with Apple/Google» и «Sign in with email» просто делают
`setScreen("home")` (`paywall-screen.tsx:69-88`) — **нет реального OAuth, биллинга,
проверки подписки.** Текущий auth работает только через OTP/email
(`lib/api/auth.ts`).

**Что сделать на бэке (если фича в скоупе):**
| Метод | Путь | Назначение |
|-------|------|------------|
| `POST` | `/api/v1/auth/oauth/google` | вход/регистрация по Google id_token → `AuthResponse` |
| `POST` | `/api/v1/auth/oauth/apple` | вход/регистрация по Apple |
| `GET` | `/api/v1/billing/subscription` | статус подписки (`free`/`pro`, срок) |
| `POST` | `/api/v1/billing/checkout` | создать сессию оплаты (Stripe/RevenueCat и т.п.) |
| `POST` | `/api/v1/billing/webhook` | вебхук провайдера платежей |

> Минимально для запуска: добавить `GET /billing/subscription`, чтобы paywall
> показывался по реальному статусу, а не всегда. OAuth и checkout — отдельная веха.
> Если монетизации пока нет — убрать paywall из флоу.

---

## 13. Прочие захардкоженные значения (🔴)

| Значение | Где | Чем заменить |
|----------|-----|--------------|
| «Active Days: **14**» | `home-screen.tsx:921` (profile) | поле из персонажа/activity (`active_days`) |
| Иконка профиля в хедере (статичная) | `home-screen.tsx` `BottomNav`/header | по желанию — аватар пользователя |

---

## Рекомендованный порядок работ

1. **§3** — добавить `this_week/last_week/mega_streak` в персонажа и убрать локальную
   формулу уровня. Минимум усилий, чинит видимые расхождения.
2. **§8, §9, §10** — агрегаты активности/стриков из уже существующих
   routine/quest-completions. Один-два эндпоинта закрывают сразу 3 экрана.
3. **§11** — рефлексия + инсайты (переиспользует AI-подсистему онбординга).
4. **§6, §7** — Social и Collab: самый большой модуль. Сначала продуктовое решение —
   делаем или прячем. Если делаем — это отдельная веха с новой доменной моделью.
5. **§12** — биллинг/OAuth: отдельная веха, нужна только при запуске монетизации.

> Для всего нового — синхронно обновлять [`openapi.yaml`](openapi.yaml) и фикстуры в
> [`examples/`](examples/), затем добавлять клиента в `lib/api/*` и маппер в
> `lib/mappers/*` (паттерн уже сложился: `campaign-mapper`, `routine-mapper`,
> `character-mapper`).

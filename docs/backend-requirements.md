# Backend requirements — что нужно подключить по каждому компоненту

> Снимок состояния фронтенда на **2026-06-06** (после фаз 0–5 интеграции
> profile/character и §3b Life Radar). Цель документа: для каждой фичи UI
> зафиксировать **текущий источник данных**, **что фронт ожидает** и **что
> нужно сделать на бэке** (новые эндпоинты + форма ответа).
>
> Базовый контракт: все ответы в обёртке `{ "success": true, "data": ... }`
> (см. [`openapi.yaml`](openapi.yaml), [`profile_endpoints_integration.md`](profile_endpoints_integration.md),
> [`phase5_characteristics_integration.md`](phase5_characteristics_integration.md)),
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
| 3 | Персонаж: XP / level / streak / avatar / bio / week / active_days | profile (ProfileTab), edit-profile | ✅ | `GET /users/me/character` + `/auth/me` | — есть после фаз 0–4 |
| 3b | Персонаж: характеристики (12 осей) — current/max/thisWeek/lastWeek | profile (RelativeProgressCard, RadarDiagram), characteristics-screen | ✅ | `character.characteristics[12]` | — есть после фазы 5 |
| 4 | Онбординг-чат + генерация | ai-chat, goal-input, loading | ✅ | `lib/api/onboarding` | — есть |
| 5 | Фидбек по квесту | feedback | ✅ | `POST /quests/:id/feedback` | — есть |
| 6a | Список друзей | profile (Social), collab-quest-settings | 🟡 | `GET /users/me/friends` → stub `[]` | §6a — расширить когда появятся joint quests |
| 6b | Лента активности / cheer / challenge / add friend | home → Social | 🔴 | кнопки меняют локальный state | §6b — припарковано |
| 7 | Совместные квесты (Collab) | 7 экранов `collab-*` | 🔴 | `store.ts` jointQuests + UI без сети | §7 |
| 8 | Streak-сводки | day-summary, mega-streak | 🔴 | `store.ts:115` streakSummaries | §8 |
| 9 | Активность за неделю | home (heatmap полоска) | ✅ | `character.week_activity` | — есть |
| 10 | Хитмап вклада (год) | profile | ✅ | `GET /users/me/activity` | — есть |
| 11 | AI-рефлексия / инсайты | ai-reflection | 🔴 | хардкод в компоненте | §11 |
| 12 | Paywall / подписка / OAuth | paywall, auth | 🔴 | заглушки | §12 |
| 13 | Аватар + bio в профиле, Active Days | profile | ✅ | `character.avatar_url/bio/active_days_count` | — есть |

---

## Что закрыто после фаз 0–5 (2026-06-06)

Эти разделы убраны как полностью реализованные:

### Фазы 0–4 (контракт профиля / персонажа)
- **§3 базовое:** xp/level/streak/avatar/bio/week_activity/active_days_count, dual-shape `level_progress` (внутри `/auth/me` vs рядом в `/users/me/character`), локальная формула уровня удалена.
- **§9 week activity:** теперь `character.week_activity[7]` парсится в `weekActivity: boolean[]`.
- **§10 хитмап:** `Math.random()` выпилен, подключён `GET /users/me/activity` через `useActivity()` хук с year-view окном. Компонент `ActivityHeatmap` переписан: исправлены баги выравнивания дней недели, UTC-month парсинг, hover-tooltip, skeleton/error states.
- **§13:** Active Days, аватар в ProfileTab, bio под именем.
- **Edit profile:** новый экран `edit-profile` (PATCH `/users/me/character` для name+bio, PUT `.../avatar` для multipart).
- **Friends stub:** `GET /users/me/friends` → `[]` подключён, `DEMO_FRIENDS` выпилен из `store.ts` и `collab-quest-settings.tsx`, `FriendActivity` переписан под новый контракт (`kind` enum + `payload`).

### Фаза 5 (Life Radar / characteristics)
- **§3b characteristics (12 осей):** бэк отдаёт `character.characteristics[12]` (стабильный канонический порядок, единица — completions count, cap=20). Маппер парсит snake → camel, имя оси подставляется через `axisLabel(key)` локально, неизвестные ключи отбрасываются (защита от будущих расширений). `RadarDiagram`, `RelativeProgressCard`, `characteristics-screen` — все читают `userProgress.characteristics` и теперь показывают реальные данные.
- **Bootstrap-gap закрыт:** в `app-provider` добавлен `useEffect` на mount, который тянет `getUserCharacter()`. До этого богатые поля (avatar/bio/week_activity/active_days_count) подтягивались только после первого toggle привычки. Теперь — сразу после логина.

Полные доки контрактов:
- [`profile_endpoints_integration.md`](profile_endpoints_integration.md) — фазы 0–4.
- [`phase5_characteristics_integration.md`](phase5_characteristics_integration.md) — фаза 5.

---

## 3b. ✅ Закрыто в фазе 5

Полный контракт и детали имплементации — [`phase5_characteristics_integration.md`](phase5_characteristics_integration.md).
Краткая сводка изменений на фронте — в блоке «Что закрыто» выше.

---

## 6a. Список друзей — расширить контракт когда появятся joint quests (🟡)

**Сейчас:** `GET /api/v1/users/me/friends` подключён и возвращает `[]` (stub).
Маппер `lib/mappers/friend-mapper.ts` уже знает формат `FriendFeedItem`
(см. profile_endpoints_integration.md §8).

**Что подключится автоматически когда бэк начнёт отдавать данные:**
рендер в `SocialFeedCard` (home-screen.tsx), `collab-quest-settings`
(friend picker), avatar fallback на инициал.

**Заблокировано:** см. §7 (joint quests). Источника реальных дружб не существует
пока нет invite-флоу.

---

## 6b. Социальные действия — припарковано (🔴)

**Сейчас:** кнопки «Cheer» и «Challenge» в `SocialFeedCard` (home-screen.tsx)
и заглушка add-friend меняют только локальный state.

**Что сделать на бэке (когда фича выйдет из паркинга):**

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/v1/users/me/activity-feed?cursor=&limit=50` | лента активности друзей |
| `POST` | `/api/v1/users/me/friends/:userId/cheer` | реакция «подбодрить» |
| `POST` | `/api/v1/users/me/friends/:userId/challenge` | вызвать на joint-quest (см. §7) |
| `POST` | `/api/v1/users/me/friends` | добавить друга (по коду/нику/email) |
| `DELETE` | `/api/v1/users/me/friends/:userId` | unfriend |

**Ответ feed** (фронт уже знает этот формат — мапер готов):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "friend_user_id",
        "name": "Alex",
        "avatar_url": "https://...jpg?v=...",
        "kind": "completed_quest",
        "payload": { "quest_id": "...", "quest_title": "Get Fit" },
        "quest_label": "Get Fit",
        "characteristic": "discipline",
        "happened_at": "2026-06-05T19:51:00Z"
      }
    ],
    "next_cursor": null
  }
}
```

**Решено:** «припарковать» до запуска joint quests
(см. `phase4_friends_questions.md`). Friends-домен не имеет источника данных
без invite-флоу.

---

## 7. Совместные квесты (Collab) (🔴)

**Сейчас:** `jointQuests` целиком захардкожен (`lib/store.ts:127+`). Все 7
экранов работают только на локальном стейте: `collab-quest-settings`,
`collab-invite`, `collab-impact-input`, `collab-friend-status`,
`collab-quest-failure`, `collab-celebration`, `collab-final-results`.

**На бэке эндпоинтов для collab нет вообще.** Таблиц `joint_quests`,
`friendships`, `friend_events` нет. Roadmap не зафиксирован.

**Фронт ожидает** (`lib/types.ts` → `JointQuest`, `CollabPlayer`):
```ts
JointQuest:   { id, title, description, deadline, daysLeft, status, player1, player2 }
CollabPlayer: { id, name, avatar, progress, totalTasks, rankPoints, streak,
                failedTasks, impactScore, roadmapPreview[] }
```

**Что сделать на бэке (новый модуль):**

| Метод | Путь | Назначение |
|-------|------|------------|
| `POST` | `/api/v1/joint-quests` | создать совместный квест |
| `POST` | `/api/v1/joint-quests/:id/invite` | пригласить друга (→ `collab-invite`) |
| `POST` | `/api/v1/joint-quests/:id/accept` | принять приглашение (→ создаёт двунаправленную friendship) |
| `GET` | `/api/v1/joint-quests` | список активных/завершённых |
| `GET` | `/api/v1/joint-quests/:id` | детали + оба игрока (`collab-friend-status`) |
| `POST` | `/api/v1/joint-quests/:id/impact` | внести impact-значение |
| `GET` | `/api/v1/joint-quests/:id/results` | финальные результаты |

**Замечания:**
- `deadline` — отдавать в ISO (`2026-03-30`), `daysLeft` считать на фронте.
- Принятие invite одновременно создаёт обоих в `friend_events` и запись в
  `friendships` (источник для §6a).

**Решение нужно:** «делаем joint quests» или «прячем collab-экраны из роутера».
До решения collab-* — мёртвый код.

---

## 8. Streak-сводки (🔴)

**Сейчас:** `streakSummaries` захардкожен (`lib/store.ts:115`). Экраны:
`day-summary`, `mega-streak-reset`, `mega-streak-success`.

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

> Данные выводимы из существующих routine-completions — отдельная таблица не
> нужна, достаточно агрегата по дате.

---

## 11. AI-рефлексия и инсайты (🔴)

**Сейчас:** 3 карточки инсайтов (`INSIGHT_CARDS`) — захардкоженные тексты
(`ai-reflection.tsx:15`). Поле рефлексии (`textarea`) **никуда не отправляется** —
только `setSubmitted(true)` (`ai-reflection.tsx:49`).

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

**Сейчас:** кнопки «Continue with Apple/Google» и «Sign in with email» просто
делают `setScreen("home")` (`paywall-screen.tsx:69-83`) — **нет реального OAuth,
биллинга, проверки подписки.** Текущий auth работает только через OTP/email
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
> показывался по реальному статусу, а не всегда. OAuth и checkout — отдельная
> веха. Если монетизации пока нет — убрать paywall из флоу.

---

## Рекомендованный порядок работ

1. **§8 streak summary** — один эндпоинт-агрегат, закрывает 3 экрана
   (day-summary, mega-streak-reset, mega-streak-success). Самый дешёвый
   следующий шаг: данные выводятся из существующих routine-completions, новой
   таблицы не нужно.
2. **§11 рефлексия + инсайты** — AI уже работает (онбординг), две новых ручки.
   Хорошее завершение онбординг-петли «прошёл квест → отрефлексировал».
3. **§7 + §6b** — Joint Quests + социальные действия. Самая большая глыба:
   сначала продуктовое решение «делаем или прячем». Если делаем — это
   отдельная веха с новой доменной моделью (`joint_quests`, `friendships`,
   `friend_events`). До решения collab-* — мёртвый код в `screen-router.tsx`.
4. **§12 биллинг/OAuth** — отдельная веха, только при запуске монетизации.

> Для всего нового — синхронно обновлять [`openapi.yaml`](openapi.yaml) и
> фикстуры в [`examples/`](examples/), затем добавлять клиента в `lib/api/*` и
> маппер в `lib/mappers/*` (паттерн уже сложился: `campaign-mapper`,
> `routine-mapper`, `character-mapper`, `activity-mapper`, `friend-mapper`).

# Joint Quests — анализ фронта и требования к бэку

> Снимок состояния на **2026-06-06**. Цель документа: дать бэк-команде полную
> картину UI-прототипа, доменных типов, зашитых предположений и развилок,
> прежде чем они начнут писать план реализации. Это анализ, а не контракт —
> часть решений нужно согласовать продуктово.

---

## TL;DR

На фронте — **7 экранов готового UI без единого сетевого вызова**, прототип-«коробка». На бэке — **0 эндпоинтов, 0 таблиц, 0 домена**. Зависит ещё и от Friends-домена (§6 в `backend-requirements.md`), который тоже припаркован.

Это **не одна фаза, а отдельная веха** масштаба профиля × 2.

Прежде чем писать ТЗ, нужно **продуктовое решение** по 6 развилкам (§5 ниже) — без них любой план окажется фантазией.

---

## 1. Что у фронта уже есть

### Экраны (7 шт, ~1160 строк) и их потоки

| Экран | Что показывает | Откуда читает сейчас |
|---|---|---|
| `collab-quest-settings` | Создание joint-квеста: toggle Joint + выбор друга из списка | `userProgress.friends` (после фазы 4) — пустой массив |
| `collab-invite` | Карточка приглашения от друга: title, deadline, два roadmap-превью, Accept/Decline | `jointQuests[0]` — мок |
| `collab-impact-input` | Ввод impact-значения после задачи (например «прочитал 30 страниц») | local state |
| `collab-friend-status` | Сравнительный экран: ты vs друг, статус сегодня, прогресс, ранги | `currentJointQuest` + `lastImpactValue` |
| `collab-quest-failure` | Финал когда квест провален: оба проигравших | `currentJointQuest` |
| `collab-celebration` | Финал когда квест выполнен | `currentJointQuest` |
| `collab-final-results` | Таблица результатов: ранги, impact-скоры, winner | `currentJointQuest` |

### Доменные типы (`lib/types.ts:134-156`)

```ts
CollabPlayer = {
  id, name, avatar, progress, totalTasks, rankPoints,
  streak, failedTasks, impactScore, roadmapPreview[]
}
JointQuest = {
  id, title, description, deadline, daysLeft, status,
  player1, player2   // ровно 2 игрока, жёстко
}
```

### Store (`lib/store.ts`)

- `jointQuests: JointQuest[]` — захардкожен один Read-12-Books мок (`store.ts:115-148`).
- `currentJointQuest: JointQuest | null`
- `lastImpactValue: string` — последнее введённое impact-значение.
- Экшены: `setCurrentJointQuest`, `addJointQuest`. **API-слоя нет**.

### Зафиксированные предположения фронта (важно для бэка)

1. **Ровно 2 игрока** (player1 = «You», player2 = «друг»). Не группа. Архитектурно зашито в `JointQuest`.
2. **Mode = Rank** только (`isRank` gate в `collab-quest-settings:35`). Casual joint-квестов не предполагается.
3. **AI-Generated Roadmaps** для обоих игроков (по 4 шага показано на invite-экране) — индивидуальные планы под каждого, не общий backlog.
4. **Daily checkpoint**: каждый игрок может «закрыть день», а другой видит «Completed today / Not completed yet» (`collab-friend-status:74-92`). День — единица сравнения.
5. **Impact** — необязательное числовое/строковое поле после выполнения задачи, AI его потом скорит (`collab-impact-input:58`).
6. **Encourage** — действие «подбодрить друга» когда он ещё не закрыл день (`collab-friend-status:104-115`).
7. **Rank Points + Impact Score + Rank Increase** — три параметра в финале. Winner определяется по `rankPoints` (`collab-final-results:27`).

### Чего на фронте уже сейчас **захардкожено** или **симулируется**

- `Math.random() > 0.4` для статуса друга в `collab-friend-status:23-24` — нет источника.
- `deadline: "Mar 30, 2026"` строка (не ISO).
- `daysLeft` приходит вместе с deadline — должно считаться на фронте.
- `roadmapPreview: string[]` — просто массив строк, без структуры подзадач.
- Все `+50%` от rankPoints проигравшему в `collab-final-results:75-76` — magic numbers, скоринговая логика не описана.

---

## 2. Чего у бэка нет вообще

| Слой | Состояние |
|---|---|
| Таблицы БД | нет `joint_quests`, `joint_quest_players`, `joint_quest_invites`, `joint_quest_daily_progress`, `joint_quest_impacts` |
| Доменные типы Go | нет `JointQuest`, `JointPlayer`, `Invite`, `Impact` |
| Usecase | нет создания / инвайта / принятия / daily-progress / scoring / завершения |
| HTTP-эндпоинты | 0 |
| OpenAPI | 0 |
| AI-генерация двух roadmap'ов | не подключено к OpenAI adapter |
| Скоринговая модель | не определена (rank points / impact score / rank increase) |
| Friend-домен (зависимость) | §6 припаркован, есть только stub `GET /friends → []` |

---

## 3. Что нужно бэку — минимальный набор

### Таблицы (предполагаемые, нуждаются в подтверждении)

```sql
-- joint_quests: основная сущность
CREATE TABLE joint_quests (
  id              UUID PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  creator_user_id UUID NOT NULL REFERENCES users(id),
  deadline        DATE NOT NULL,           -- ISO, не строка
  status          TEXT NOT NULL,           -- 'pending_accept' | 'active' | 'completed' | 'failed'
  total_tasks     INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ
);

-- 2 игрока на квест
CREATE TABLE joint_quest_players (
  joint_quest_id  UUID REFERENCES joint_quests(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  role            TEXT NOT NULL,           -- 'creator' | 'invitee'
  accepted_at     TIMESTAMPTZ,
  progress        INT DEFAULT 0,
  rank_points     INT DEFAULT 0,
  streak          INT DEFAULT 0,
  failed_tasks    INT DEFAULT 0,
  impact_score    INT DEFAULT 0,
  roadmap         JSONB,                   -- AI-сгенерированный личный план: string[] или task[]
  PRIMARY KEY (joint_quest_id, user_id)
);

-- daily checkpoint: закрыл ли игрок день
CREATE TABLE joint_quest_daily_progress (
  joint_quest_id  UUID,
  user_id         UUID,
  date            DATE NOT NULL,
  completed       BOOL DEFAULT FALSE,
  impact_value    TEXT,                    -- свободный input от collab-impact-input
  impact_score    INT,                     -- AI-скор после фоновой обработки
  encouraged_by   UUID[],                  -- кто прислал encourage сегодня
  PRIMARY KEY (joint_quest_id, user_id, date)
);
```

### Эндпоинты (минимум для всех 7 экранов)

| Метод | Путь | Закрывает экран |
|---|---|---|
| `POST` | `/api/v1/joint-quests` | `collab-quest-settings` — создаёт quest в статусе `pending_accept`, дёргает AI для 2 roadmap |
| `POST` | `/api/v1/joint-quests/{id}/invite` | (часть create — отправляет уведомление инвайту) |
| `GET` | `/api/v1/joint-quests/{id}` | `collab-invite`, `collab-friend-status`, финалы — полный snapshot |
| `POST` | `/api/v1/joint-quests/{id}/accept` | `collab-invite` Accept — переводит в `active`, создаёт двунаправленную friendship |
| `POST` | `/api/v1/joint-quests/{id}/decline` | `collab-invite` Decline |
| `GET` | `/api/v1/joint-quests?status=active` | список активных (для возможного listing в profile/social tab, сейчас не используется, но логично) |
| `POST` | `/api/v1/joint-quests/{id}/daily-progress` | `collab-impact-input` — закрыть день + (опц.) impact_value |
| `POST` | `/api/v1/joint-quests/{id}/encourage` | `collab-friend-status` Encourage |
| (фоновая работа) | scoring job | пересчёт `rank_points / impact_score / streak` при daily-progress |

### AI-интеграция

- Бэк должен в момент `POST /joint-quests` дёргать OpenAI adapter (уже есть для онбординга) **дважды** — отдельный roadmap для каждого игрока из их `goal/title`. Сохраняется в `joint_quest_players.roadmap`.
- AI-скоринг impact — отдельная фоновая задача после `POST /daily-progress`. Можно отложить на v2 и пока возвращать `impact_score = numeric_part_of(impact_value)`.

---

## 4. Чего фронту не хватает от бэка — закрытые гэпы

### A. Контракт `JointQuestData`

Фронту нужен **унифицированный snapshot-объект** для `GET /joint-quests/{id}`. Предлагаемая структура (snake_case, обёрнуто в envelope `{success, data}`):

```json
{
  "id": "uuid",
  "title": "Read 12 Books Together",
  "description": "...",
  "deadline": "2026-03-30",
  "status": "pending_accept | active | completed | failed",
  "total_tasks": 12,
  "players": [
    {
      "user_id": "uuid",
      "name": "Alibi",
      "avatar_url": "https://...",
      "role": "creator | invitee",
      "progress": 5,
      "total_tasks": 12,
      "rank_points": 320,
      "streak": 7,
      "failed_tasks": 1,
      "impact_score": 480,
      "roadmap_preview": ["Read Ch.1-3", "..."],
      "completed_today": true,
      "today_impact_value": "30 pages"
    }
  ]
}
```

→ Фронту нужно **переименовать** `player1/player2` → `players[]` или мапить через адаптер. Раскладка зашита в типах — придётся менять.

### B. Откуда брать `daysLeft`

Сейчас на фронте используется готовое поле. **Предложение:** бэк отдаёт только `deadline: ISO`, фронт сам считает `daysLeft = ceil((deadline - today) / 86400)`. Так же как мы делали с `happened_at` для friends.

### C. Статус друга «completed today»

Поле `players[].completed_today` (bool) и `today_impact_value` (string|null) — производные от `joint_quest_daily_progress` записи за today UTC.

Сейчас фронт это **симулирует через `Math.random()`** (`collab-friend-status:23-24`). Уберём после подключения.

### D. Avatar другого игрока

Сейчас `avatar: string` (одна буква, e.g. `"A"`). После §6/character — должно быть **`avatar_url: string | null`** + фолбэк на initials через уже существующий `getInitial()` (Phase 4).

### E. Скоринг финала

`collab-final-results` показывает 3 параметра:
- **Rank Points Earned** — бэк должен отдать готовое число.
- **Rank Increase** — `+2` winner, `+1` loser. Это уже скоринг — бэку отдавать готовым.
- **Impact Score** — бэк отдаёт.

Фронт **не должен** сам считать никакой `Math.floor(p1.rankPoints * 0.5)` — выпилить.

### F. Зависимость от friends-домена

Чтобы экран `collab-quest-settings` (friend picker) показывал реальных друзей, нужен реализованный `GET /users/me/friends` с непустым массивом. Это **bootstrap-проблема**: пока друзей нет — joint quest некого пригласить — friend-домен пуст.

**Развилка:** либо
- **(a)** Параллельно с joint quests добавить `POST /users/me/friends` (add friend by email / код) и реализовать friends-инвайт-флоу — закрывает «как появляются первые друзья».
- **(b)** Сделать joint quest приглашение **по email** — invitee не обязан быть в твоих friends, дружба создаётся атомарно при accept (как обсуждалось в `phase4_friends_questions.md`).

Я бы предложил **(b)** — atomarno, без отдельной add-friend ручки. Это и было решением phase 4.

---

## 5. Развилки, которые нужно решить **до** ТЗ бэку

Без ответов на эти 6 вопросов план будет фантазией.

### Q1. Joint quest — это автономный квест или joint-обвязка над обычным quest?

Сейчас непонятно: либо joint quest **создаёт два регулярных `quests`** в существующей системе (один на каждого игрока), либо это **параллельная сущность** без связи с обычными квестами.

- **(a)** Joint = два связанных обычных квеста. Тогда есть `quests.joint_quest_id`, импакт-flow интегрируется в обычный task-complete. Дешевле для AI (один генератор), сложнее для бэка (миграция).
- **(b)** Joint = отдельный домен. Не трогаем `quests`. Дублируем roadmap-логику. Проще миграционно, дороже на AI.

### Q2. Кто такой «day» в daily-progress?

«Completed today» — это:
- **(a)** Игрок выполнил **хотя бы одну** задачу из своего roadmap'а за день?
- **(b)** Игрок выполнил **все** задачи за день?
- **(c)** Игрок явно нажал «I'm done for today»?

В `collab-impact-input` юзер сам логит impact после выполнения задачи. Видимо ответ — **(a)** или **(c)**. Зависит от Q1.

### Q3. Что такое impact_score и как он скорится?

Свободный текст `"30 pages"` → число. Варианты:
- **(a)** AI парсит и нормализует на бэке (нужна модель).
- **(b)** Фронт парсит как число (regex).
- **(c)** Hold for v2: пока `impact_score = текущая длина строки * 10` или похожая dummy-формула.

### Q4. Encourage — это просто notif или влияет на скоринг?

В UI это просто кнопка «подбодрить». На бэке — храним `encouraged_by[]`? Считается ли это бонусом к rank? Или просто push-нотификация другу?

### Q5. Группы или строго 1-на-1?

Сейчас фронт жёстко на 2 игроков. **Подтверждаем 2-only**, или закладываем `players[]` массивом для будущего?

### Q6. Что делать с `collab-*` экранами в роутере **сейчас**?

До запуска бэка эти экраны — мёртвый код. Спрятать `setScreen("collab-quest-settings")` из всех точек входа? Или оставить с заглушкой «Coming soon»?

Сейчас `collab-quest-settings` достижим из `collab-final-results:132` (после фейкового финала) и `quest-roadmap.tsx` если есть кнопка «Make Joint». Стоит **сначала спрятать роуты** (1-2 строки изменения), а уже потом строить домен.

---

## 6. Рекомендованный порядок (если решение «делаем»)

| Шаг | Зона | Что |
|---|---|---|
| 0 | Продукт | Ответы на Q1–Q5. Без них дальше нет смысла. |
| 1 | Фронт (тривиально) | Спрятать `collab-*` из роутера (соответствующие кнопки), пока бэк строит. |
| 2 | Бэк | Миграция таблиц + домен `JointQuest`/`Player`/`Invite`. |
| 3 | Бэк | `POST /joint-quests` + AI-генерация двух roadmap'ов (переиспользует онбординг-prompt). |
| 4 | Бэк | `POST /invite`, `POST /accept` (с atomarной friendship), `POST /decline`. |
| 5 | Бэк | `GET /joint-quests/{id}` — полный snapshot для всех экранов. |
| 6 | Бэк | `POST /daily-progress` + scoring job (rank_points, streak, impact). |
| 7 | Бэк | `POST /encourage` (notif + опционально бонус). |
| 8 | Бэк | Завершение квеста (cron по deadline или triggered) → `status: completed/failed`. |
| 9 | Фронт | Поэтапно: подключить API-слой `lib/api/joint-quests.ts`, маппер, обновить типы `players[]` вместо `player1/2`, убрать `Math.random` в friend-status, починить deadline → ISO + daysLeft на фронте, выпилить magic-numbers скоринга. |
| 10 | Фронт | Включить роуты обратно. |

---

## 7. Оценка трудозатрат (грубо)

- **Бэк:** 4 таблицы + домен + 7 эндпоинтов + AI-флоу + scoring = **~2-3 недели чистого времени**.
- **Фронт после готового бэка:** API-слой + маппер + 7 экранов на реальные данные + типы переделать = **~3-5 дней**.
- **Продуктовые решения (Q1–Q5):** должны прийти **до** старта, иначе переписки.

---

## 8. Что я жду от бэка после прочтения этого документа

1. **Ответы на Q1–Q5** (продуктовые) — желательно с обоснованием выбора.
2. **Подтверждение или коррекция таблиц** в §3 — может быть, что-то можно нормализовать иначе, или часть полей переложить в существующие таблицы.
3. **Подтверждение контракта `JointQuestData`** в §4.A — формат `players[]`, snake_case, обёртка envelope.
4. **Подтверждение по friend-зависимости** (§4.F) — пойдём по варианту (b) atomarno или нужен (a) отдельный add-friend?
5. **Решение по Q6** — нужен ли мне как фронту спрятать collab-роуты пока бэк работает (это 5 минут работы) или оставить как есть для дев-тестов?
6. **План реализации** с разбивкой на фазы (как для профиля) — после ответов выше.

---

## Связанные доки

- [`backend-requirements.md`](backend-requirements.md) — §7 (Joint Quests), §6 (Friends)
- [`phase4_friends_questions.md`](phase4_friends_questions.md) — решения по friend-домену
- [`phase5_characteristics_integration.md`](phase5_characteristics_integration.md) — как мы делали характеристики, пример полного цикла

Готов отвечать на любые уточняющие вопросы.

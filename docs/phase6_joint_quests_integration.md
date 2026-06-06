# Phase 6 (joint quests) — что готово на бэке

Привет! Joint Quests домен полностью на проде с **2026-06-06**. Можно убирать всё захардкоженное в `lib/store.ts` (jointQuests мок, `Math.random` в `collab-friend-status`, magic-numbers скоринга в `collab-final-results`) и подключать API.

Контракт согласован по `joint_quests_analysis.md §4.A` + ответам Q1–Q8 + encourage rate-limit. Здесь — финальный wire-format, edge-кейсы и checklist того, что менять на фронте.

---

## TL;DR

- **Base URL** прод: `https://questfly-platform-production.up.railway.app`
- **Auth**: все 7 эндпоинтов под `Authorization: Bearer <access_token>` (тот же JWT что используется сейчас для `/auth/me`).
- **Envelope**: стандартный httpx — `{success, data}` на успехе, `{success: false, error: {code, message}}` на ошибке.
- **Контракт snake_case + `players[]` массив**, не `player1/player2`. Типы `JointQuest`/`CollabPlayer` в `lib/types.ts` надо переделать (раздел «Что менять на фронте» ниже).
- **Не считайте на фронте**: `days_left`, `rank_points`, `rank_increase`, `impact_score`. Всё это либо производное от ISO-полей (deadline), либо приходит готовым числом из бэка.

---

## 1. Endpoints (полный список из 7)

Все под `/api/v1/joint-quests`, все под auth-middleware.

| Метод | Путь | Что закрывает | Возвращает |
|---|---|---|---|
| `POST` | `/joint-quests` | `collab-quest-settings` Submit | `201` + `JointQuest` (status=pending_accept) |
| `GET` | `/joint-quests` | Лист активных в Social tab | `200` + `{joint_quests: JointQuest[]}` |
| `GET` | `/joint-quests/{id}` | `collab-invite`, `collab-friend-status`, финалы | `200` + `JointQuest` + per-player `completed_today` |
| `POST` | `/joint-quests/{id}/accept` | `collab-invite` Accept | `200` + `JointQuest` (status=active) |
| `POST` | `/joint-quests/{id}/decline` | `collab-invite` Decline | `200` + `JointQuest` (status=declined) |
| `POST` | `/joint-quests/{id}/daily-progress` | `collab-impact-input` Submit | `200` + `JointQuest` (с обновлёнными агрегатами игрока) |
| `POST` | `/joint-quests/{id}/encourage` | `collab-friend-status` Encourage | `204` (без тела) |

---

## 2. `JointQuest` — единый снапшот

Это то, что возвращают все эндпоинты кроме `/encourage`. **Один контракт на все экраны.**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Read 12 Books Together",
    "description": "shared reading goal",
    "deadline": "2026-12-31",
    "status": "pending_accept | active | completed | failed | declined",
    "total_tasks": 12,
    "winner_user_id": null,
    "completed_at": null,
    "players": [
      {
        "user_id": "uuid",
        "role": "creator | invitee",
        "accepted_at": "2026-06-06T09:12:33Z",
        "progress": 5,
        "total_tasks": 12,
        "rank_points": 0,
        "rank_increase": 0,
        "longest_streak": 5,
        "failed_tasks": 0,
        "impact_score": 145,
        "roadmap_preview": ["Pick a book", "Read chapters 1-3", "..."],
        "completed_today": true,
        "today_impact_value": "30 pages"
      },
      {
        "user_id": "uuid",
        "role": "invitee",
        ... тот же набор полей ...
      }
    ]
  }
}
```

`players` всегда массив длиной **2** (минимум 1 элемент пока invitee — email-pending, см. §6). Порядок — `creator` сначала, `invitee` вторым. Не закладывайтесь на порядок, фильтруйте по `role`.

### Поля по группам

| Поле | Семантика |
|---|---|
| `id`, `title`, `description` | Метаданные квеста. |
| `deadline` | **ISO date** `YYYY-MM-DD`, UTC. `daysLeft` фронт считает сам: `ceil((deadline - today)/86400)`. |
| `status` | enum. Переходы: `pending_accept → active|declined`, `active → completed|failed`. См. §5. |
| `total_tasks` | Сколько шагов в roadmap'е каждого игрока. Дублируется в `players[].total_tasks` чтобы экраны игрока не лезли наверх. |
| `winner_user_id` | UUID победителя или `null` (`null` если статус не `completed`, либо если оба игрока финишировали с равным прогрессом — tie). |
| `completed_at` | RFC3339 UTC. Не `null` только когда квест в терминальном статусе (`completed`/`failed`). |
| `players[].role` | `creator` или `invitee`. **Один из** ровно двух игроков. |
| `players[].accepted_at` | RFC3339 UTC. `null` для invitee до Accept. У creator всегда заполнено (он принял в момент Create). |
| `players[].progress` | Количество закрытых дней (== completed daily_progress rows). Растёт с 0 до `total_tasks`. |
| `players[].rank_points` / `rank_increase` | **Финальный скоринг.** До `Finalize` оба = 0. Фронт **только отображает**, ничего не считает. Формулы — §4. |
| `players[].longest_streak` | Самая длинная серия закрытых дней подряд внутри квеста. Используется в скоринге. |
| `players[].failed_tasks` | Сколько шагов игрок НЕ закрыл к дедлайну. До `Finalize` = 0. |
| `players[].impact_score` | Сумма всех `impact_score` за все дни. Для скоринга и для отображения «Impact Score N» на финале. |
| `players[].roadmap_preview` | Массив строк, длина == `total_tasks`. AI-сгенерированный план шагов. Используйте как есть для invite-экрана и для подсказок в `collab-friend-status`. |
| `players[].completed_today` | **Bool за сегодня (UTC)**. Заполняется только на `GET /{id}` (snapshot путь). На остальных эндпоинтах == `false` для всех игроков (не путайте). |
| `players[].today_impact_value` | Сырая строка, которую игрок ввёл в `collab-impact-input` сегодня. `null` если день не закрыт или impact не указан. |

---

## 3. Запросы (request bodies)

### POST `/joint-quests`

```json
{
  "title": "Read 12 Books Together",
  "description": "shared reading goal",
  "invitee_email": "bob@example.com",
  "deadline": "2026-12-31",
  "total_tasks": 12
}
```

- `invitee_email` — **обязательно**. Не нужен `friend_picker`. Принимает любой email, даже не зарегистрированный (см. §6 «Email-pending invitee»).
- `deadline` — `YYYY-MM-DD` UTC, в будущем (валидатор отрежет прошлое).
- `total_tasks` — > 0. AI сгенерит ровно столько шагов в roadmap для каждого игрока (параллельно, синхронно перед ответом).

**Ошибки**: `400 INVALID_INPUT` (валидация / cap=3 quests achieved / self-invite / cap у invitee), `500` (AI-fail — в этом случае квест НЕ создаётся, можно ретраить).

### POST `/joint-quests/{id}/daily-progress`

```json
{ "impact_value": "30 pages" }
```

- `impact_value` опциональное, может быть пустая строка / отсутствовать. Бэк парсит как **первое число**, capped at 1000; если чисел нет → baseline 10 очков.
- **Идемпотентность по `(user, date UTC)`**: второй вызов в тот же день → `409 CONFLICT`. На UX это значит «кнопка disabled после первого нажатия» — после успеха перерисовывайте `collab-friend-status` со свежими данными.

### POST `/joint-quests/{id}/encourage`

```json
{ "target_user_id": "uuid-другого-игрока" }
```

- Скоп: только когда `target.completed_today == false` (за сегодня UTC) и `quest.status == active`.
- **Rate-limit**: 1 раз в день в направлении на квест. Второй вызов → `409 ALREADY_ENCOURAGED_TODAY`. На UX — disable кнопку после успешного 204.
- Возвращает **`204 No Content`**, не тело. Перерисовывайте через `GET /joint-quests/{id}`.

---

## 4. Скоринг — что приходит готовым

В финальных экранах (`collab-final-results`, `collab-celebration`, `collab-quest-failure`) **выпиливайте все локальные расчёты типа `Math.floor(p1.rankPoints * 0.5)`**. Бэк отдаёт:

- `rank_points` — финальное число очков за квест. Формула на бэке:
  ```
  base = 100 * progress / total_tasks
  streak_mult = 1 + min(longest_streak, 14) / 14 * 0.5   // 1.0..1.5
  encourage_bonus = min(5 * encouragements_received, 25)
  impact_bonus = sum(impact_score) / total_tasks
  total = (base * streak_mult) + encourage_bonus + impact_bonus
  if winner: total *= 1.20
  ```
- `rank_increase`:
  - `status=completed`: winner `+2`, loser `+1`.
  - `status=failed`: обоим `+0` (никакого минуса).
- `impact_score` — суммарный за квест, для отображения на финале как есть.

Всё это в `players[]` каждого игрока. Победитель определяется через `winner_user_id` на квесте (UUID или `null` если tie или failed).

**Когда скоринг проставляется:** только когда статус становится `completed` или `failed`. До этого все три поля = 0.

---

## 5. Статусы и переходы

```
                 Create
                   ↓
            pending_accept ──── Decline ───→ declined  (терминальный)
                   │
                Accept
                   ↓
                 active ──── deadline + cron ───→ completed | failed  (терминальные)
```

- `pending_accept` — после Create. Только creator принял (`accepted_at` у creator стоит, у invitee `null`).
- `active` — invitee нажал Accept, friendship создалась автоматически (см. §6 «Атомарная friendship»).
- `declined` — invitee нажал Decline. Квест дальше не живёт, никакой friendship.
- `completed` — оба игрока дошли до `total_tasks` к дедлайну. Может быть с winner'ом (`winner_user_id` set) или tie (`winner_user_id: null`).
- `failed` — хотя бы один не дошёл к дедлайну. `winner_user_id: null`.

**Финализация**: hourly cron на бэке перебирает `status=active AND deadline < today_utc` и проставляет терминальный статус. Между «deadline истёк» и «cron сработал» может пройти до часа — за это время `GET /{id}` будет показывать `status: active`. Это ОК — UI просто рендерит то что есть.

---

## 6. Email-pending invitee — что это и как себя ведёт

Если приглашаем по email который ещё не зарегистрирован — квест всё равно создаётся, но invitee «полу-фантомный»:

- В DB: 1 запись в `joint_quest_players` (creator) + 1 запись в `joint_quest_email_invites` (email + quest_id).
- На фронте: в момент Create вернётся `JointQuest` с **`players` длиной 1** (только creator). На invite-экране сейчас зашит «вы и друг» layout — пока такого invitee нет, либо не показывайте этот квест в Social tab, либо рисуйте «awaiting registration» состояние.
- Когда email-получатель регистрируется через ваш существующий `/auth/register` flow — бэк автоматом конвертирует invite в полноценный `joint_quest_players` row, и `GET /joint-quests/{id}` сразу вернёт `players` длиной 2 + invitee со `accepted_at: null`. Это та же логика что invite от зарегистрированного юзера, просто отложенная во времени.

**Атомарная friendship**: при `POST /accept` бэк создаёт двунаправленную friendship между двумя игроками атомарно (одна tx). После этого они появятся друг у друга в friends-фиде когда тот будет реально подключён.

---

## 7. Коды ошибок

Стандартный httpx-envelope. Что может прилететь:

| HTTP | code | Когда |
|---|---|---|
| `400` | `INVALID_INPUT` | Валидация тела; self-invite; превышен soft-cap `MaxActiveJointQuestsPerUser=3` (у creator или invitee); невалидный deadline. |
| `400` | `BAD_REQUEST` | Битый JSON; некорректный UUID в path / `target_user_id`. |
| `401` | `UNAUTHORIZED` | Нет / истёк токен. |
| `403` | `FORBIDDEN` | Creator пытается Accept (только invitee); невалидная роль для перехода. |
| `404` | `NOT_FOUND` | Квеста нет или вы не участник (бэк намеренно не различает, чтобы не утекало). |
| `409` | `CONFLICT` | Уже залогирован сегодня; уже encouraged сегодня; target уже completed_today; самоэнкэрэдж; невалидный переход статуса. |
| `500` | `INTERNAL_ERROR` | AI-fail при Create; БД-ошибка. Можно ретраить Create. |

Все коды разруливаются через `error.code` (стабильный enum), `error.message` — для дебага, не для UI.

---

## 8. Что менять на фронте — checklist

### Типы (`lib/types.ts:134-156`)

Сейчас:
```ts
JointQuest = { ..., player1, player2 }
```

Стало (минимально):
```ts
JointQuest = {
  id: string;
  title: string;
  description: string;
  deadline: string;          // ISO date "YYYY-MM-DD", не "Mar 30, 2026"
  status: 'pending_accept' | 'active' | 'completed' | 'failed' | 'declined';
  total_tasks: number;
  winner_user_id: string | null;
  completed_at: string | null;  // RFC3339
  players: JointPlayer[];    // длина 2 (или 1 для email-pending)
};

JointPlayer = {
  user_id: string;
  role: 'creator' | 'invitee';
  accepted_at: string | null;
  progress: number;
  total_tasks: number;
  rank_points: number;
  rank_increase: number;
  longest_streak: number;
  failed_tasks: number;
  impact_score: number;
  roadmap_preview: string[];
  completed_today: boolean;
  today_impact_value: string | null;
};
```

Все экраны которые читают `player1`/`player2` (`collab-invite`, `collab-friend-status`, `collab-final-results`, etc.) переписать на `players.find(p => p.role === 'creator')` / `'invitee'`, либо `players[0]` / `players[1]` если уверены в порядке (creator всегда первый).

### Удалить

- `Math.random() > 0.4` для статуса друга в `collab-friend-status:23-24` → `player.completed_today`.
- Любые `Math.floor(p1.rankPoints * 0.5)` / `+50%` в `collab-final-results:75-76` → читайте `rank_points`/`rank_increase` напрямую.
- Жёсткий мок `jointQuests` в `store.ts:115-148`.

### Заменить

- Friend-picker UI в `collab-quest-settings` (`isRank` gate, friend list из `userProgress.friends`) → простой `<input type="email">` с валидацией формата. Friend-list пока не работает, поэтому picker бессмысленен (см. также §6).
- `daysLeft` пропадает из контракта → считайте на фронте из `deadline`: `Math.ceil((Date.parse(deadline) - Date.now()) / 86400000)`.
- Хардкод `deadline: "Mar 30, 2026"` строка → ISO `"YYYY-MM-DD"` от бэка + `Intl.DateTimeFormat` для отображения.
- Avatar один-буквенный → `avatar_url: string | null` ожидайте на user-уровне (он не в `JointPlayer`, придёт из общих character-эндпоинтов). Fallback на `getInitial(name)` как у вас уже есть в Phase 4.

### Добавить

- API-слой `lib/api/joint-quests.ts` с 7 функциями (на каждый эндпоинт). Используйте существующий axios/fetch-wrapper с auth headers, как у вас сделано для других модулей.
- Маппинг error.code → UI-сообщения для `CONFLICT` подвидов (`ALREADY_LOGGED_TODAY`, `ALREADY_ENCOURAGED_TODAY`, `ALREADY_COMPLETED`). Message с бэка сейчас на английском без префикса; рекомендую `error.code` смотреть.
- Состояние «email-pending invitee» в `collab-invite` UI (см. §6).

### Включить роуты обратно

Если уже спрятали `collab-*` из роутера — возвращайте, бэк готов.

---

## 9. Edge cases / gotchas

1. **`completed_today` только в `GET /{id}`.** Остальные эндпоинты (Create, Accept, daily-progress responses) возвращают `JointQuest` с `completed_today: false` для всех игроков — это просто не считается на их пути. Если нужен актуальный «closed today?» после, например, daily-progress — сделайте дополнительный `GET /{id}`.

2. **Cron-задержка финализации.** До часа после дедлайна квест может оставаться в `status: active`. Если нужна точность — на фронте можно показывать `daysLeft <= 0 && status === 'active'` как «finalising...». Cron подтянет в течение часа.

3. **Soft-cap 3 у обоих сторон.** Если создаёшь квест приглашая Bob'а, а у Bob'а уже 3 активных — Create вернёт `400 INVALID_INPUT` с месседжем про invitee's cap. UX: показывайте инклюзивно «у вас или у друга уже 3 активных квеста».

4. **Tie на `completed`.** Если оба дошли до `total_tasks` с равным прогрессом — `winner_user_id: null`, статус всё равно `completed`. В UI: «Both completed — no winner» / показывайте обоих с loser-bonus.

5. **`role: 'creator'` всегда первый в массиве.** Бэк сортирует `players` по `role` ASC (`'creator' < 'invitee'` alphabetically). Можно полагаться, но безопаснее `.find(role===)`.

6. **`encouragements_received` не отдаётся в DTO.** Используется только в скоринге на бэке. Если нужно показывать «3 encouragements» на UI — скажите, добавим в `JointPlayer`.

---

## 10. Smoke / sanity для интеграции

Когда подключите слой:

```bash
# 401 без токена — ожидаем
curl -sS https://questfly-platform-production.up.railway.app/api/v1/joint-quests

# С токеном — список (изначально пустой, status:200)
curl -sS https://questfly-platform-production.up.railway.app/api/v1/joint-quests \
  -H "Authorization: Bearer <token>"

# Create
curl -sS -X POST https://questfly-platform-production.up.railway.app/api/v1/joint-quests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","invitee_email":"friend@test.com","deadline":"2026-12-31","total_tasks":7}'
```

---

## 11. OpenAPI

`docs/openapi.yaml` в репо — все 7 операций с `operationId`, response schemas и примерами. Если генерите TS-клиент из спеки — там готовый источник истины:

- `createJointQuest`, `listActiveJointQuests`, `getJointQuest`,
- `acceptJointQuest`, `declineJointQuest`,
- `recordJointQuestDailyProgress`, `encourageJointQuestPlayer`.

Примеры ответов в `docs/examples/httpx-joint-quest-snapshot.json` и `httpx-joint-quests-list.json`.

---

## 12. Что бэк ждёт от фронта (короткий чеклист)

- [ ] Подключить API-слой по §1.
- [ ] Переделать типы под `players[]` (§8).
- [ ] Выпилить `Math.random` / magic numbers скоринга (§8).
- [ ] Friend-picker → email-input на `collab-quest-settings` (§8).
- [ ] Email-pending invitee UI state (§6).
- [ ] `completed_today` подцепить из snapshot (§9.1).
- [ ] `daysLeft` считать на фронте из ISO `deadline`.
- [ ] Cron-задержка финализации — отрисовка transition-стейта если квест истёк но ещё не финализирован (§9.2).
- [ ] Включить collab-роуты обратно.

Когда катите — пингуйте, если нужны новые поля (`encouragements_received` в DTO, отдельный эндпоинт, что-то ещё) — добавим в follow-up PR.

---

## Связанные доки

- [`joint_quests_analysis.md`](joint_quests_analysis.md) — исходный анализ фронт-стороны (что было).
- [`phase6_joint_quests_plan.md`](phase6_joint_quests_plan.md) — план бэка + отчёт о реализации.
- [`openapi.yaml`](openapi.yaml) — машиночитаемый контракт.
- [`api-policy.md`](api-policy.md) — общие правила envelope / errors / snake_case.

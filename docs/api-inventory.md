# API инвентаризация (фаза 0)

Снимок на основе `internal/system/router/router.go`. Дальнейшие OpenAPI/примеры должны **покрывать весь список** и явно помечать исключения из §2.

## 1. Источники DTO

| Пакет | Файлы |
|-------|--------|
| Auth | `internal/sso/adapters/in/http/dto/requests.go`, `responses.go` |
| Questfly HTTP | `internal/questfly/adapters/in/http/dto/onboarding_dto.go`, `campaign_dto.go`, `task_dto.go`, `feedback_dto.go`, `routine_dto.go`, `user_dto.go` |
| Envelope / ошибки | `internal/common/httpx/response.go` (`Response`, `ErrorInfo`, коды) |

## 2. Формат ответа: обёртка `{ success, data }` vs исключения

- **По умолчанию (через `httpx`)**: успех `200/201/202` с телом `{"success": true, "data": ...}`; ошибка `{"success": false, "error": {"code", "message"}}`.
- **Исключения (не `httpx.Success` / `httpx.Error`):**
  - `GET /health` — плоский JSON: `{ "status", "database" }` (200) или при падении БД: `{ "status", "database", "error" }` (503).
  - `GET /api/v1/ping` — плоский JSON: `{ "message", "version" }` (200).
  - `DELETE /api/v1/routines/:id` — **204 No Content**, тела нет.
- **Заметка:** клиенты, ожидающие везде `success`, должны **особо обработать** `/health`, `/api/v1/ping` и 204.

## 3. Маршруты (полный перечень)

`Auth`: `Bearer` access token, кроме явно публичных.

| Метод | Путь | Auth | Обработчик | DTO / примечание |
|-------|------|------|------------|------------------|
| GET | `/health` | нет | `healthCheckHandler` | плоский JSON, см. §2 |
| GET | `/api/v1/ping` | нет | `pingHandler` | плоский JSON |
| POST | `/api/v1/auth/send-otp` | нет | `AuthHandler.SendOTP` | `SendOTPRequest` → `OTPSentResponse` |
| POST | `/api/v1/auth/register` | нет | `Register` | `RegisterRequest` → `AuthResponse` |
| POST | `/api/v1/auth/login` | нет | `Login` | `LoginRequest` → `AuthResponse` |
| POST | `/api/v1/auth/refresh` | нет | `RefreshToken` | `RefreshTokenRequest` → `TokenData` |
| GET | `/api/v1/auth/me` | Bearer | `Me` | `AuthResponse` (token пустой в хендлере) |
| POST | `/api/v1/onboarding/start` | Bearer | `OnboardingHandler.StartOnboarding` | `StartOnboardingRequest` → `StartOnboardingResponse` |
| POST | `/api/v1/onboarding/:id/message` | Bearer | `SendMessage` | `SendMessageRequest` → `ChatResponseDTO`; `:id` = campaign_id |
| POST | `/api/v1/onboarding/:id/generate` | Bearer | `GenerateQuest` | тело не биндится → `httpx.Accepted` + `AsyncResponse` |
| GET | `/api/v1/onboarding/:id/conversation` | Bearer | `GetConversation` | → `ConversationResponse` |
| GET | `/api/v1/onboarding/:id/status` | Bearer | `GetCampaignStatus` | → `CampaignStatusResponse` |
| GET | `/api/v1/campaigns` | Bearer | `ListCampaigns` | → `ListCampaignsResponse` |
| GET | `/api/v1/campaigns/:id` | Bearer | `GetCampaign` | → `GetCampaignResponse` |
| GET | `/api/v1/campaigns/:id/roadmap` | Bearer | `GetRoadmap` | → `RoadmapResponse` |
| GET | `/api/v1/campaigns/:id/current-quest` | Bearer | `GetCurrentQuest` | → `GetCurrentQuestResponse` |
| POST | `/api/v1/campaigns/:id/next-quest` | Bearer | `GenerateNextQuest` | → 202 + `AsyncResponse` |
| GET | `/api/v1/tasks/:id` | Bearer | `GetTaskDetail` | → `TaskDetailResponse`; `:id` = **task** id |
| POST | `/api/v1/subtasks/:id/complete` | Bearer | `CompleteSubtask` | → `CompleteSubtaskResponse`; `:id` = **subtask** id |
| POST | `/api/v1/subtasks/:id/uncomplete` | Bearer | `UncompleteSubtask` | → `UncompleteSubtaskResponse` |
| POST | `/api/v1/quests/:id/complete` | Bearer | `CompleteQuest` | → `CompleteQuestResponse`; `:id` = **quest** id |
| POST | `/api/v1/quests/:id/feedback` | Bearer | `SubmitFeedback` | `SubmitFeedbackRequest` → `SubmitFeedbackResponse` |
| POST | `/api/v1/quests/manual` | Bearer | `CreateRoutine` (alias) | то же, что `POST /routines` — `CreateRoutineRequest` → `RoutineData` |
| POST | `/api/v1/routines` | Bearer | `CreateRoutine` | `CreateRoutineRequest` → `RoutineData` |
| GET | `/api/v1/routines` | Bearer | `ListRoutines` | query `include_inactive=true`; → `ListRoutinesResponse` |
| GET | `/api/v1/routines/daily` | Bearer | `ListDaily` | query `date=YYYY-MM-DD`; → `DailyRoutinesResponse` |
| GET | `/api/v1/routines/:id` | Bearer | `GetRoutine` | → `RoutineDetailResponse` |
| PATCH | `/api/v1/routines/:id` | Bearer | `UpdateRoutine` | `UpdateRoutineRequest` → `RoutineData` |
| DELETE | `/api/v1/routines/:id` | Bearer | `DeleteRoutine` | 204, без тела |
| POST | `/api/v1/routines/:id/complete` | Bearer | `CompleteRoutine` | query `date`; → `CompleteRoutineResponse` |
| POST | `/api/v1/routines/:id/uncomplete` | Bearer | `UncompleteRoutine` | query `date`; → `UncompleteRoutineResponse` |
| GET | `/api/v1/users/me/character` | Bearer | `GetCharacter` | → `GetCharacterResponse` |
| PUT | `/api/v1/users/me/character/name` | Bearer | `UpdateCharacterName` | `UpdateCharacterNameRequest` → `UpdateCharacterNameResponse` |

## 4. Параметры пути: типы `id`

В OpenAPI стоит завести **отдельные** `campaign_id`, `quest_id`, `task_id`, `subtask_id`, `routine_id` (сейчас в Gin везде `:id`).

| Префикс пути | Семантика `:id` |
|--------------|-------------------|
| `/onboarding/:id/...` | campaign_id (UUID) |
| `/campaigns/:id/...` | campaign_id |
| `/tasks/:id` | task_id |
| `/subtasks/:id/...` | subtask_id |
| `/quests/:id/...` (кроме `/manual`) | quest_id |
| `/routines/:id/...` | routine_id |

## 5. Чеклист «всё учтено» для фазы 1 (OpenAPI)

- [x] Все **33** маршрута из §3 внесены в [`openapi.yaml`](openapi.yaml) (включая `/health`, `/ping`, `POST /quests/manual` = `POST /routines`).
- [x] **Bearer** глобально; публичные пути с `security: []`: `send-otp`, `register`, `login`, `refresh`, `/health`, `/ping`.
- [x] Зафиксированы **3 формата тела**: httpx-обёртка, плоский JSON (health/ping), 204 без тела.
- [x] Enums: статусы кампании / квеста / беседы в `openapi.yaml` (`components/schemas`); **коды ошибок** — блок в `info` + `HttpxErrorBody`.
- [x] Query: `include_inactive`, `date` (рутины; complete/uncomplete).

Проверка: `cd docs && npx @redocly/cli lint openapi.yaml` (конфиг [`redocly.yaml`](redocly.yaml)).

## 6. Фаза 2 (выполнено)

- [x] **`operationId`** на всех операциях (для `openapi-generator` / орval и т.п.).
- [x] **`components/examples`** + ссылки `examples` на ответах: список кампаний, onboarding status, current-quest, subtask complete, async 202, ошибка 409 `FEEDBACK_REQUIRED`.
- [x] **JSON-фикстуры** в [`examples/`](examples/) (копия для тестов/фронта; синхронизируйте при изменении спеки).
- [x] Описания **tags**, расширенный **`info`** (матрица `error.code`).

## 7. Фаза 3 (выполнено)

- [x] **CI:** GitHub Actions [`.github/workflows/openapi-lint.yaml`](../.github/workflows/openapi-lint.yaml) — `redocly lint` при изменениях `docs/openapi.yaml` / `docs/redocly.yaml`.
- [x] **Makefile:** `make docs-lint`, `make docs-site` (Redoc в `docs/_site/`, в `.gitignore`).
- [x] **Политика API:** [`api-policy.md`](api-policy.md) — токены, `/me`, async, пагинация, logout.

**Следующий шаг (фаза 4+):** при необходимости — npm lock в `docs/`, публикация `docs/_site` в Pages, правки бэка под UTC/`/me` по политике.

# Frontend — план работ по привычкам (routines)

> Снимок на 2026-06-04. Бэк по рутине/привычкам **завершён** (CRUD + новые поля
> `characteristic`, `time_of_day`, `reminder_enabled`, `reset_on_skip`,
> `campaign_id`/`quest_id`, эндпоинт `POST /api/v1/routines/ai-suggest`).
> Этот документ фиксирует фронт-работы, которые осталось сделать, и подводные камни,
> вскрытые при анализе кода.

> ⚠️ **`docs/openapi.yaml` отстал** от реального бэка: в снапшоте нет новых полей и
> `ai-suggest`. Спека синхронизируется в рамках этого же плана (шаг 7). Источник
> истины по именам полей — реализованный бэк (snake_case как ниже).

## Контракт новых полей

`CreateRoutineRequest` / `UpdateRoutineRequest` / `RoutineData` дополнены:

| Поле | Тип | Заметка |
|------|-----|---------|
| `characteristic` | enum `AxisKey` (12 осей) | словарь = `lib/types.ts` `AxisKey`; неизвестное → 400 |
| `time_of_day` | string `"HH:MM"` \| null | время напоминания |
| `reminder_enabled` | bool | включено ли напоминание (доставка пушей — отдельная задача, инфры нет) |
| `reset_on_skip` | bool | дефолт `true`; для Rank форсится на бэке (TODO, см. backend) |
| `campaign_id` / `quest_id` | string \| null | привязка к стори-лайну (миграция 008) |

`AxisKey` (12 осей, единый словарь фронта и бэка):
`health, appearance, environment, finance, career, growth, love, family, friends,
creativity, lifestyle, spirituality`.

`POST /api/v1/routines/ai-suggest` — тело `{ "prompt": string }`, ответ
`{ success, data: { suggestions: RoutineDraft[] } }` (3 шт.), где `RoutineDraft` несёт
те же поля, что и черновик routine (emoji, title, characteristic, repeat_type,
times_per_week, days_of_week, time_of_day, …).

---

## Чеклист

### Phase 1 — happy path создания (приоритет) ✅

- [x] **API-клиент** (`lib/api/routines.ts`): добавлены `characteristic`, `time_of_day`,
  `reminder_enabled`, `reset_on_skip`, `campaign_id`, `quest_id` в
  `CreateRoutinePayload` и `UpdateRoutinePayload`; добавлена `aiSuggestRoutines(prompt)`.
- [x] **Общий список осей** (`lib/axes.ts`): 12 осей `{ key, label }` + `axisLabel()` +
  `isAxisKey()`.
- [x] **Тип `Habit`** (`lib/types.ts`): добавлены `reminderEnabled?`, `notes?`,
  `durationMinutes?`, `xpReward?`.
- [x] **Маппер записи** (`lib/mappers/habit-form-to-routine.ts`): пробрасывает
  `characteristic` (ось), `time_of_day`, `reminder_enabled`, `reset_on_skip`,
  `quest_id` из `linkedQuestId`; `notes/duration/xp` — из черновика, иначе дефолты.
- [x] **Маппер чтения** (`lib/mappers/routine-mapper.ts`): ⚠️ **баг исправлен** — теперь
  `characteristic: str(r.characteristic, "")` (раньше сюда писался `repeat_type`).
- [x] **Форма** (`create-habit-manual.tsx`): `CHARACTERISTICS`
  (`Strength/Focus/Creativity/Discipline`) заменены на 12 осей из `lib/axes.ts`.
- [x] **Напоминание** (`habit-notification.tsx`): прокидывает `reminderEnabled` +
  сохраняет `timeOfDay`.

### Phase 2 — реальный AI (`ask-ai-habit.tsx`) ✅

- [x] `setTimeout` + 4 хардкода заменены на `aiSuggestRoutines(prompt)`.
- [x] Показываются 3 выбираемые подсказки из `data.suggestions`; маппер
  `aiSuggestionToHabitDraft` (чтобы «Edit» открывал форму с заполненными полями).
- [x] Обработка ошибки/пустого ответа — сообщение, без молчаливого падения.

### Phase 3 — убрать тихий фолбэк ✅

- [x] ⚠️ Место — **`habit-confirmation.tsx`** (`handleDone`), не `app-provider.tsx`.
  При падении `createRoutine` показывается ошибка + «Try Again» вместо
  `addHabit(pendingHabit)`. (Тихие `catch` в `app-provider`
  `refreshHabitsFromApi`/`toggleHabit` — намеренные офлайн/401, не трогаем.)

### Phase 4 — поля notes / duration / xp в форме ✅

- [x] Инпуты в `create-habit-manual.tsx` (notes-textarea, степперы duration/xp) +
  поля в `Habit`. Маппер шлёт значения формы (дефолты 15 мин / 10 XP остаются на
  случай отсутствия).

### Phase 5 — edit / delete ✅

- [x] **Без нового маршрута** — `create-habit-manual` переиспользован как edit-форма
  (режим по `editingHabit` в store). Это проще, чем отдельный экран, и чинит заодно
  потерю префилла для «Edit» из AI-подсказки.
- [x] Точка входа из карточки на home (`home-screen.tsx`): контент ряда стал кнопкой
  → `setEditingHabit(habit)` + переход на форму. Тогл-кнопка осталась отдельной.
- [x] Guard по типу id в `app-provider`: `updateHabitOnApi`/`deleteHabitOnApi` —
  UUID → `updateRoutine`/`deleteRoutine` + `refreshHabitsFromApi`; локальные `h-…` —
  мутация стейта.
- [x] Edit-режим сохраняет `id` существующей привычки и зовёт PATCH (не дубль через
  `createRoutine`); ошибки апдейта/удаления показываются, без тихого фолбэка.
- [x] `add-habit-entry` сбрасывает `editingHabit`/`pendingHabit` → форма открывается
  пустой для нового создания.

### Phase 7 — синхронизация контракта ✅

- [x] `docs/openapi.yaml`: новые поля в `CreateRoutineRequest`/`UpdateRoutineRequest`/
  `RoutineData` + путь и схемы `ai-suggest`.
- [x] `tsc` / `vitest` зелёные (24/24).

---

## Порядок

`API-типы → Phase 1 (+ fix чтения) → Phase 2 → Phase 3` закрывают весь happy-path
создания (в т.ч. через AI). Phase 4 и Phase 5 — отдельно, не блокируют запуск.

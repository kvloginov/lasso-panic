СОЗДАЙ ПОЛНОСТЬЮ РАБОЧУЮ ИГРУ “Lasso Panic” 
Стек: Vite + TypeScript + Phaser 3.
Рендер: Phaser (canvas/webgl auto), строгий pixel-art режим.
ВСЕ ГРАФИЧЕСКИЕ И ЗВУКОВЫЕ АССЕТЫ ДОЛЖНЫ БЫТЬ СГЕНЕРИРОВАНЫ В КОДЕ (никаких PNG/WAV файлов).

КОМАНДЫ
- `npm i`
- `npm run dev`
- `npm run build`
- `npm run preview`

ОБЩАЯ КОНЦЕПЦИЯ ИГРЫ
- Игра на одном экране.
- Есть шкала здоровья (0..100) — постоянно уменьшается.
- Игрок выделяет мышью “лассо” область. Если внутри только активные предметы ОДНОГО вида — предметы собираются, счет растет, здоровье лечится.
- Если внутри есть предмет другого вида — игрок получает урон (предметы при ошибке не удаляются).
- Предметы постоянно появляются. Перед появлением показывается полупрозрачное “превью” места спавна (ghost preview).
- Сложность растет: предметов больше, спавн чаще, типов со временем больше, размер может слегка уменьшаться.

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ (PHASER)
- Phaser Config:
  - `render: { pixelArt: true, antialias: false, roundPixels: true }`
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 540 }`
- Все спрайты — текстуры 8×8, сгенерированные при инициализации и сохраненные в TextureManager.
- Масштабирование спрайтов: каждый предмет рисуется увеличенным (например scale 6..10) с сохранением пиксельности.
- Никаких внешних изображений, шрифтов и звуков.

ГЕНЕРАЦИЯ ПИКСЕЛЬ-АРТ ТЕКСТУР (8×8)
- Создай папку `src/assets/` с:
  - `palettes.ts` — мягкая сочетающаяся палитра (мило, пастельные тона), например 8–12 цветов (hex).
  - `sprites.ts` — определения спрайтов предметов как массивы (или компактные строки) длиной 64 (8×8), где каждый элемент — индекс цвета в палитре или -1 для прозрачности.
    - Для каждого typeId должно быть минимум 1 “иконка” (форма), лучше 2–3 варианта/фрейма для небольшого оживления (микро-анимация).
  - `generateTextures.ts` — функция генерации Phaser текстур из 8×8 данных:
    - Используй `scene.textures.createCanvas(key, 8, 8)` и рисуй пиксели через canvas 2d (ImageData или fillRect(1×1)).
    - После рисования `canvasTexture.refresh()`.
- Примеры милых форм (8×8): звездочка, сердечко, облачко, листик, капля, конфета, мордочка-blob.
- Дополнительно: “preview” можно рисовать той же текстурой, просто с alpha=0.35 и слегка меньшим scale (или легкая пульсация).

ГЕНЕРАЦИЯ РЕТРО-SFX (БЕЗ ФАЙЛОВ)
- Создай `src/audio/sfx.ts`:
  - Реализуй генератор звуков на WebAudio (OscillatorNode + Gain envelope), без загрузки ассетов.
  - Поддержи минимум 5 событий:
    - `spawnPreview()` (тихий “tick”)
    - `activate()` (короткий “pop”)
    - `success(count)` (приятный “coin” с повышением частоты, зависит от count/комбо)
    - `error()` (резкий “buzz”/“zap” + низкий тон)
    - `gameOver()` (нисходящий “fail”)
  - Встрои простой ADSR/envelope, формы волн: square/triangle/saw, и по желанию шум (noise buffer) для удара.
- Интеграция:
  - Используй WebAudio контекст Phaser (если доступен) или отдельный AudioContext.
  - Добавь mute toggle (`M`) и отображение в HUD.

UI / HUD
- Отрисовка через Phaser Text + Graphics:
  - Health bar (полоска + число).
  - Score (целое).
  - Time Survived (сек).
  - Difficulty/Level (число).
  - Combo (если реализовано).
- Стартовый оверлей: “Click to Start”.
- Game Over: итоговый score/time + “Restart” (клик или R).
- Сохраняй best score и best time в localStorage.

ИГРОВЫЕ СУЩНОСТИ
- Item:
  - id, typeId, state: `preview` | `active`
  - sprite: Phaser.GameObjects.Sprite
  - timers: previewRemaining
  - методы: setPreview(), activate(), destroy()
- Храни предметы в массиве и/или Phaser Group (без physics).
- Preview НЕ считается при выделении (только active).

СПАВН И СЛОЖНОСТЬ
- В `src/config.ts` вынеси все параметры:
  - healthStart=100, healthDrainPerSec
  - healPerItem, damageBase, damagePerWrong
  - previewDuration
  - spawnIntervalStart, spawnIntervalMin, spawnAcceleration
  - startTypes, maxTypes, typesIncreaseEverySec
  - itemScaleStart, itemScaleMin (опционально)
  - maxItemsSoftCap (опционально)
- Спавн:
  - Каждые spawnInterval секунд создай предмет в `preview`.
  - Через previewDuration переведи в `active`, проиграй SFX activate(), сделай маленький tween (pop).
- Позиционирование:
  - Случайно внутри игрового поля с отступом.
  - Простая попытка избежать сильных пересечений: N попыток найти позицию, где distance до других центров > minDist.

ЛАССО-ВЫДЕЛЕНИЕ (ОСНОВНОЕ)
- Реализуй рисование лассо мышью:
  - pointerdown: начать путь
  - pointermove: добавлять точки только если расстояние от последней > threshold (например 4–6 px)
  - pointerup: закрыть полигон
- Визуал лассо:
  - Phaser Graphics: линия + легкая прозрачность.
  - На отпускании можно коротко “flash” контура (0.1s).
- Вычисление попадания:
  - Собери `Phaser.Geom.Polygon` из точек.
  - Сделай быстрый bbox отсев: minX/maxX/minY/maxY.
  - Для каждого ACTIVE предмета проверяй попадание по центру (`Phaser.Geom.Polygon.Contains(poly, x, y)`).
- Правила:
  - Если выбрано 0 активных — ничего.
  - Если выбранные активные все одного typeId — УСПЕХ:
    - удалить выбранные предметы
    - score += count
    - health += healPerItem*count (+ опционально комбо-бонус)
    - success SFX
    - легкий визуальный фидбек (+N текст)
  - Если среди выбранных >1 typeId — ОШИБКА:
    - wrongCount = countSelected - maxSameTypeCount (или просто countSelected - countOfMajorType)
    - damage = damageBase + damagePerWrong*wrongCount
    - health -= damage
    - error SFX + экранный flash/встряска камеры
    - предметы НЕ удалять
- Минимальная валидность лассо:
  - >= 3 точки и длина пути > minLen (например 30px), иначе игнор.

ГЕЙМЛУП / СЦЕНЫ / СТРУКТУРА
- Сцены:
  - `BootScene` (или `PreloadScene`): генерация текстур 8×8, инициализация аудио, переход в GameScene.
  - `GameScene`: вся логика.
- Файловая структура (минимум):
  - `src/main.ts`
  - `src/game/scenes/BootScene.ts`
  - `src/game/scenes/GameScene.ts`
  - `src/game/entities/Item.ts`
  - `src/game/systems/Spawner.ts`
  - `src/game/systems/LassoSelection.ts`
  - `src/ui/Hud.ts`
  - `src/assets/palettes.ts`
  - `src/assets/sprites.ts`
  - `src/assets/generateTextures.ts`
  - `src/audio/sfx.ts`
  - `src/config.ts`
  - `src/utils/*` (clamp, rng, geometry helpers)
- Управление:
  - ЛКМ: рисовать лассо
  - R: restart (на game over)
  - M: mute
  - P: pause (опционально)

ПОЛИРОВКА
- Камера/экран:
  - На ошибку: короткая тряска (camera shake) + красный flash overlay.
  - На успех: приятный зеленый flash и/или sparkle-частицы (можно простыми точками через Graphics).
- Превью спавна: легкая пульсация alpha (tween yoyo).

КРИТЕРИИ ГОТОВНОСТИ
- Игра запускается через `npm run dev`.
- Текстуры 8×8 генерируются в коде и выглядят как милый пиксель-арт.
- Звуки генерируются в рантайме (без файлов) и воспроизводятся на события.
- Предметы спавнятся с превью → активируются.
- Лассо корректно собирает одинаковые типы, ошибка наносит урон.
- Здоровье постоянно убывает, игра заканчивается при 0.
- Есть старт/гейм-овер/рестарт, HUD, best score/time.

СДЕЛАЙ ВСЕ ФАЙЛЫ, НАСТРОЙ VITE+TS+PHASER, ДОБАВЬ README.md С ОПИСАНИЕМ МЕХАНИК И ПАРАМЕТРОВ config.ts.

Создай AGENTS.md в корне и веди его, добавляя туда полезные инструкции, особенно когда понимаешь, что с первой попытки не получилось сделать как надо.


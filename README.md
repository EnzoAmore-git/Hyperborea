# Hyperborea

Иммерсивная платформа-артбук и вебтун-комикс в стиле славянского фэнтези для взрослой аудитории.

Стек: React + Vite, GSAP + ScrollTrigger, Framer Motion, Lenis. Тёмная эстетика, mobile-first.

## Документация
- [`docs/proposal.md`](docs/proposal.md) — цели, стек, критерии успеха
- [`docs/design.md`](docs/design.md) — дизайн-система (цвет, типографика, анимации, layout)
- [`docs/tasks.md`](docs/tasks.md) — этапы реализации, задачи и критерии готовности
- [`docs/soundtrack.md`](docs/soundtrack.md) — адаптивная музыка читалки и подключение нейромузыки

## Разработка
```bash
npm install     # установка зависимостей
npm run dev     # дев-сервер (Vite)
npm run build   # production-сборка в dist/
npm run preview # проверка собранного сайта
```

## Деплой

### Тестовый стенд — GitHub Pages
Push в `main` автоматически собирает и публикует сайт через GitHub Actions (см. `.github/workflows/deploy.yml`). Сайт живёт в подпапке `/Hyperborea`.

### Production — hyperborea-legends.ru
Production-сборка собирается локально и заливается на виртуальный хостинг по SFTP/FTP. GitHub Pages остаётся тестовым стендом.

1. Скопируй шаблон и заполни доступы:
   ```bash
   copy .env.deploy.example .env.deploy   # Windows
   cp .env.deploy.example .env.deploy     # macOS/Linux
   ```
2. Проверь, что будет залито (сборка без соединения с хостингом):
   ```bash
   npm run deploy:dry
   ```
3. Опубликуй:
   ```bash
   npm run deploy
   ```

Скрипт собирает `dist/` с `base = /`, добавляет `deploy/.htaccess` (SPA-фолбэк и кеш-заголовки) и заливает только изменившиеся файлы. Манифест `.deploy-manifest.json` хранится на хостинге: по нему удаляются старые хешированные ассеты, посторонние файлы не трогаются.

`.env.deploy` в git не попадает. После первого деплоя привяжи домен `hyperborea-legends.ru` к каталогу сайта в панели хостинга и выпусти SSL-сертификат Let's Encrypt. DNS: A-запись `@` → IP хостинга, `www` → CNAME на `hyperborea-legends.ru` (или A-запись на тот же IP).

## Структура
- `src/` — приложение (компоненты, стили, анимации)
- `public/` — статические ассеты (шрифты, изображения, страницы комикса)
- `sources/` — исходные материалы (видео, арты-оригиналы)
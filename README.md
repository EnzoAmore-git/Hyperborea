# Webtoon Reader

Иммерсивная платформа-артбук и вебтун-комикс в стиле славянского фэнтези для взрослой аудитории.

Стек: React + Vite, GSAP + ScrollTrigger, Framer Motion, Lenis. Тёмная эстетика, mobile-first.

## Документация
- [`docs/proposal.md`](docs/proposal.md) — цели, стек, критерии успеха
- [`docs/design.md`](docs/design.md) — дизайн-система (цвет, типографика, анимации, layout)
- [`docs/tasks.md`](docs/tasks.md) — этапы реализации, задачи и критерии готовности

## Разработка
```bash
npm install     # установка зависимостей
npm run dev     # дев-сервер (Vite)
npm run build   # production-сборка в dist/
npm run preview # проверка собранного сайта
```

## Деплой
Статический сайт на GitHub Pages: push в ветку `main` автоматически собирает и публикует сайт через GitHub Actions (см. `.github/workflows/deploy.yml`).

## Структура
- `src/` — приложение (компоненты, стили, анимации)
- `public/` — статические ассеты (шрифты, изображения, страницы комикса)
- `sources/` — исходные материалы (видео, арты-оригиналы)
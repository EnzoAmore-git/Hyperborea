/**
 * Команда проекта (по титрам «Легенды о Северном Царстве»).
 * `photo` — базовый путь без размерного суффикса: компонент сам собирает
 * srcset (`-176.webp` / `-352.webp`), полученные из sources/Team через
 * `npm run optimize:images`. Если `photo` нет — аватар показывает инициалы.
 */

export const team = [
  {
    id: 'artem',
    name: 'Артём Жуков',
    role: 'Автор и художник',
    initials: 'АЖ',
    photo: '/images/team/artem-zhukov-avtor-i-khudozhnik',
  },
  {
    id: 'belov',
    name: 'Николай Белов',
    role: 'Литературный редактор',
    initials: 'НБ',
    photo: '/images/team/nikolay-belov-literaturnyy-redaktor',
  },
  {
    id: 'zakharenkov',
    name: 'Денис Захаренков',
    role: 'AI и IT сопровождение',
    initials: 'ДЗ',
    photo: '/images/team/denis-zakharenkov-ai-i-it-soprovozhdenie',
  },
  {
    id: 'eismont',
    name: 'Герман Эйсмонт',
    role: 'Художник',
    initials: 'ГЭ',
    photo: '/images/team/german-eysmont-khudozhnik',
  },
  {
    id: 'yaroshenko',
    name: 'Арина Ярошенко',
    role: 'Ассистент по маркетингу',
    initials: 'АЯ',
    photo: '/images/team/arina-yaroshenko-assistent-po-marketingu',
  },
];

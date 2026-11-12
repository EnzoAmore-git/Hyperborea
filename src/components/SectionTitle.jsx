import { motion } from 'framer-motion';
import { DURATION, EASING } from '../animations/timing.js';

/**
 * Заголовок секции: надзаголовок-мета + заголовок + разделитель «от края до края».
 * Разделитель — повторяющийся бесшовный орнамент (border-rushnyk.svg, C2PA)
 * как tiled background у .section-line (effects.css); линия растёт через
 * ScrollTrigger (`data-reveal="line"` — см. scrollReveal.js / effects.css).
 */
export default function SectionTitle({ num, title }) {
  return (
    <motion.div
      className="section-title-wrap"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: DURATION.slow / 1000, ease: EASING.smooth }}
    >
      <p className="meta">{num}</p>
      <h2 className="section-title">{title}</h2>
      <span
        className="section-line"
        aria-hidden="true"
        data-reveal="line"
      />
    </motion.div>
  );
}
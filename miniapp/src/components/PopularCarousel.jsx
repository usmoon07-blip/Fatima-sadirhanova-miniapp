import { useCallback, useEffect, useRef, useState } from 'react';
import CourseCard from './CourseCard';

const AUTO_MS = 2500; // har necha ms da keyingisiga suriladi
const RESUME_MS = 6000; // qo'l bilan surilgandan keyin avtomatik qayta boshlanishi

/** «Mashhur kurslar»: o'z-o'zidan yonga suriladigan karusel, markazdagi kurs — asosiy (katta) */
export default function PopularCarousel({ courses }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);
  const activeRef = useRef(0);
  activeRef.current = active;

  const scrollToIndex = useCallback((i, smooth = true) => {
    const track = trackRef.current;
    const card = track?.children[i];
    if (!track || !card) return;
    const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Qaysi kartochka markazda — o'shani faol qilamiz
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    [...track.children].forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    if (best !== activeRef.current) setActive(best);
  };

  // Avtomatik surilish
  useEffect(() => {
    if (courses.length < 2) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current || document.hidden) return;
      const next = (activeRef.current + 1) % courses.length;
      scrollToIndex(next, next !== 0 || courses.length < 3);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [courses.length, scrollToIndex]);

  const pause = () => { pausedUntil.current = Date.now() + RESUME_MS; };

  return (
    <div className="popular">
      <div
        className="popular-track"
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
      >
        {courses.map((c, i) => (
          <div key={c.id} className={`popular-slide ${i === active ? 'active' : ''}`}>
            <CourseCard course={c} wide />
          </div>
        ))}
      </div>
      {courses.length > 1 && (
        <div className="popular-dots">
          {courses.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={i === active ? 'on' : ''}
              aria-label={`${i + 1}`}
              onClick={() => { pause(); scrollToIndex(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { Clock } from 'lucide-react';
import Img from './Img';
import { useStore } from '../store/StoreContext';
import { loc } from '../lib/i18n';

export function minPrice(course) {
  return Math.min(...[course.onlinePrice, course.offlinePrice].filter(Boolean));
}

export function FormatTags({ course }) {
  const { t } = useStore();
  return (
    <div className="format-tags">
      {course.onlinePrice ? <span className="ftag online">{t.online}</span> : null}
      {course.offlinePrice ? <span className="ftag offline">{t.offline}</span> : null}
    </div>
  );
}

export default function CourseCard({ course, compact = false }) {
  const { openCourse, t, lang, money } = useStore();
  const duration = loc(course, 'duration', lang);
  return (
    <article className={`course-card ${compact ? 'compact' : ''}`} onClick={() => openCourse(course.id)}>
      <div className="course-media">
        <Img src={course.imageUrl} alt="" emoji="🎓" />
        {course.badge && <span className="badge">{course.badge}</span>}
      </div>
      <div className="course-body">
        <FormatTags course={course} />
        <h3 className="serif">{loc(course, 'title', lang)}</h3>
        {!compact && <p className="muted course-desc">{loc(course, 'description', lang)}</p>}
        <div className="course-foot">
          {duration && <span className="muted small"><Clock size={13} /> {duration}</span>}
          <b className="new-price">{t.fromPrice(money(minPrice(course)))}</b>
        </div>
      </div>
    </article>
  );
}

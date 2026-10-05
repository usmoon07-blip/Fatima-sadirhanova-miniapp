import { ChevronRight, GraduationCap } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { useStore } from '../store/StoreContext';

export default function Courses() {
  const { catalog, t, setScreen } = useStore();
  return (
    <div className="page">
      <div className="page-title">
        <h1 className="serif">{t.coursesTitle}</h1>
        <p className="muted">{t.coursesSub}</p>
      </div>

      <button type="button" className="address-card card" onClick={() => setScreen('myCourses')}>
        <span className="address-icon"><GraduationCap size={18} /></span>
        <span className="address-text"><b>{t.myCourses}</b><small>{t.myCoursesSub}</small></span>
        <ChevronRight size={18} className="muted" />
      </button>

      {catalog.courses.length ? (
        <div className="course-list">
          {catalog.courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-emoji">🎓</div>
          <p className="muted">{t.noCourses}</p>
        </div>
      )}
    </div>
  );
}

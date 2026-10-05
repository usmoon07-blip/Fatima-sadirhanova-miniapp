import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Img from './Img';
import { useStore } from '../store/StoreContext';
import { storage } from '../lib/storage';
import { haptic } from '../lib/telegram';
import { loc } from '../lib/i18n';

const DURATION = 5000;

export function StoriesRow() {
  const { catalog, setStoryIndex, lang } = useStore();
  const seen = storage.get('seenStories', []);
  if (!catalog.stories.length) return null;
  return (
    <div className="stories h-scroll">
      {catalog.stories.map((s, i) => (
        <button key={s.id} type="button" className={`story ${seen.includes(s.id) ? 'seen' : ''}`} onClick={() => setStoryIndex(i)}>
          <span className="story-ring"><Img src={s.imageUrl} alt="" /></span>
          <span className="story-title">{loc(s, 'title', lang)}</span>
        </button>
      ))}
    </div>
  );
}

export function StoryViewer() {
  const { catalog, storyIndex, setStoryIndex, goTo, lang, t } = useStore();
  const stories = catalog.stories;
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const story = storyIndex != null ? stories[storyIndex] : null;

  useEffect(() => {
    if (!story) return undefined;
    const seen = storage.get('seenStories', []);
    if (!seen.includes(story.id)) storage.set('seenStories', [...seen, story.id]);
    setProgress(0);
    let elapsed = 0;
    let last = performance.now();
    let raf;
    const tick = (now) => {
      if (!paused.current) elapsed += now - last;
      last = now;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setStoryIndex((i) => (i + 1 < stories.length ? i + 1 : null));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [story, stories.length, setStoryIndex]);

  if (!story) return null;

  const go = (dir) => {
    haptic.select();
    const next = storyIndex + dir;
    if (next < 0) return setProgress(0);
    return setStoryIndex(next < stories.length ? next : null);
  };

  return (
    <div
      className="story-viewer"
      onPointerDown={() => { paused.current = true; }}
      onPointerUp={() => { paused.current = false; }}
      onPointerCancel={() => { paused.current = false; }}
    >
      <Img src={story.imageUrl} alt={story.title} className="story-bg" eager />
      <div className="story-shade" />
      <div className="story-bars">
        {stories.map((s, i) => (
          <span key={s.id}><i style={{ width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%` }} /></span>
        ))}
      </div>
      <button type="button" className="story-close" aria-label="Yopish" onClick={() => setStoryIndex(null)}><X size={22} /></button>
      <button type="button" className="story-tap left" aria-label="Oldingi" onClick={() => go(-1)} />
      <button type="button" className="story-tap right" aria-label="Keyingi" onClick={() => go(1)} />
      <div className="story-content">
        <h2>{loc(story, 'title', lang)}</h2>
        {story.text && <p>{loc(story, 'text', lang)}</p>}
        <button type="button" className="btn btn-light" onClick={() => { setStoryIndex(null); goTo('menu', { category: 'all' }); }}>
          {t.viewMenu}
        </button>
      </div>
    </div>
  );
}

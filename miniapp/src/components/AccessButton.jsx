import { useState } from 'react';
import { CheckCircle2, LoaderCircle, PlayCircle } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { haptic, openLink } from '../lib/telegram';

/** Kursga kirish: bir martalik shaxsiy havola (yoki eski usuldagi ochiq havola) */
export default function AccessButton({ courseId, size = 'block' }) {
  const { me, t, toast, refreshMe } = useStore();
  const [loading, setLoading] = useState(false);
  const my = me.myCourses.find((c) => c.id === courseId);
  const access = my?.access;
  const cls = size === 'xs' ? 'btn btn-primary btn-xs' : 'btn btn-primary btn-block';
  const iconSize = size === 'xs' ? 14 : 18;

  if (!access) {
    return <button type="button" className={cls} disabled><PlayCircle size={iconSize} /> {t('linkSoon')}</button>;
  }
  if (access.protected && access.used) {
    return (
      <button type="button" className={`${cls} btn-done`} onClick={() => toast(t('joinedHint'))}>
        <CheckCircle2 size={iconSize} /> {t('joined')}
      </button>
    );
  }

  const open = async () => {
    if (!access.protected) {
      openLink(access.link);
      return;
    }
    setLoading(true);
    try {
      const res = await api.courseAccess(courseId);
      if (res?.used) {
        toast(t('joinedHint'));
        refreshMe();
      } else if (res?.link) {
        haptic.medium();
        openLink(res.link);
        refreshMe();
      }
    } catch (err) {
      haptic.error();
      toast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={cls} disabled={loading} onClick={open} title={access.protected ? t('oneTimeHint') : undefined}>
      {loading ? <LoaderCircle size={iconSize} className="spin" /> : <PlayCircle size={iconSize} />} {t('joinChannel')}
    </button>
  );
}

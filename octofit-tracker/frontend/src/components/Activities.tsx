import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    getJson<{ activities?: Activity[] }>('/api/activities')
      .then((payload) => {
        if (ignore) return;
        setActivities(payload.activities ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load activities');
        setActivities([]);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <p role="status">Loading activities...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <div role="alert">Unable to load activities.</div>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <p>No activities.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
              {activity.type} {activity.minutes ?? ''} minutes, {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

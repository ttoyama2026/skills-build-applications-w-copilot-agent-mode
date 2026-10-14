import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (ignore) return;
        setSuggestions(payload.suggestions ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load workout suggestions');
        setSuggestions([]);
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
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="status">Loading workout suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <div role="alert">Unable to load workout suggestions.</div>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p>No workout suggestions.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'suggestion'}-${index}`} className="list-group-item">
              {suggestion.title}: {suggestion.reason}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

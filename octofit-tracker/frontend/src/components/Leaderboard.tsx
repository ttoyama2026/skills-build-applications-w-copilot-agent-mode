import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (ignore) return;
        setLeaderboard(payload.leaderboard ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load leaderboard');
        setLeaderboard([]);
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
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <p role="status">Loading leaderboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <div role="alert">Unable to load leaderboard.</div>
        </div>
      </section>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <p>No leaderboard.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        <ul className="list-group list-group-flush">
          {leaderboard.map((entry, index) => (
            <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item">
              #{entry.rank ?? index + 1} {entry.teamName}: {entry.totalPoints ?? 0}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

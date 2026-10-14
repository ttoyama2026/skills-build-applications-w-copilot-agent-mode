import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    getJson<{ teams?: Team[] }>('/api/teams')
      .then((payload) => {
        if (ignore) return;
        setTeams(payload.teams ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load teams');
        setTeams([]);
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
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <div role="alert">Unable to load teams.</div>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p>No teams.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
              {team.name} ({team.members?.length ?? 0} members)
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

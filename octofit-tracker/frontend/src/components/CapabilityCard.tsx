import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  emptyText?: string;
};

function getItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function getDisplayText(item: unknown): string {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (!item || typeof item !== 'object') return '';

  const values = Object.entries(item as Record<string, unknown>)
    .filter(([key, value]) => !['id', '_id'].includes(key) && value !== null && value !== undefined)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) return value.filter((entry) => entry !== null && entry !== undefined).map(String);
      if (typeof value === 'object') return [JSON.stringify(value)];
      return [`${value}`];
    });

  return values.join(' ');
}

export function CapabilityCard({ title, description, endpoint, emptyText }: Props) {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    getJson<Record<string, unknown>>(endpoint)
      .then((payload) => {
        if (ignore) return;
        setItems(getItems(payload));
        setLoading(false);
      })
      .catch((caught) => {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load data');
        setItems([]);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading {title.toLowerCase()}...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <div role="alert">Unable to load {title.toLowerCase()}.</div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p>{emptyText ?? `No ${title.toLowerCase()}.`}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        <ul className="list-group list-group-flush">
          {items.map((item, index) => (
            <li key={index} className="list-group-item">
              {getDisplayText(item)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

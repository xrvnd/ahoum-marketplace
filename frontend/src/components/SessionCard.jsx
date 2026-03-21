import Link from 'next/link';

export default function SessionCard({ session }) {
  const {
    id,
    title,
    price,
    scheduled_at,
    duration_mins,
    capacity,
    is_fully_booked,
    bookings_count,
    creator_name,
  } = session;

  const date = new Date(scheduled_at).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });

  const spotsLeft = capacity - (bookings_count || 0);

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1 }}>{title}</h3>
        <span className={`badge ${is_fully_booked ? 'badge-red' : 'badge-green'}`} style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
          {is_fully_booked ? 'Full' : `${spotsLeft} spots left`}
        </span>
      </div>

      {/* Creator */}
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        by {creator_name}
      </p>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#555' }}>
        <span>📅 {date}</span>
        <span>⏱ {duration_mins} minutes</span>
        <span>👥 {capacity} capacity</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6c3fc5' }}>
          {Number(price) === 0 ? 'Free' : `₹${price}`}
        </span>
        <Link href={`/sessions/${id}`} className="btn btn-primary btn-sm">
          View Details →
        </Link>
      </div>
    </div>
  );
}
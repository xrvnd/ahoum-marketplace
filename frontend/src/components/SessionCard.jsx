import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * Shared Date formatter to avoid re-instantiating Intl.DateTimeFormat
 * on every single render of a card.
 */
const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatDateTime = (dateString) => {
  if (!dateString) return 'TBA';
  try {
    return dateFormatter.format(new Date(dateString));
  } catch {
    return 'Invalid Date';
  }
};

const getGridSpanClasses = (size) => {
  switch (size) {
    case '2x2': return 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2';
    case '2x1': return 'col-span-1 sm:col-span-2 row-span-1';
    case '1x2': return 'col-span-1 sm:row-span-2';
    case '1x1':
    default:    return 'col-span-1 row-span-1';
  }
};

const getStatusBadgeClasses = (isFullyBooked, status) => {
  if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
  if (status === 'completed') return 'bg-gray-100 text-gray-800 border-gray-200';
  if (isFullyBooked)          return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'in-progress') return 'bg-blue-100 text-blue-800 border-blue-200';
  
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
};

const getReadableStatus = (status, isFullyBooked, spotsLeft) => {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'completed') return 'Completed';
  
  return isFullyBooked ? 'Full' : `${spotsLeft} spots left`;
};

export default function SessionCard({ session, size = '1x1' }) {
  const {
    id,
    title,
    description,
    price,
    scheduled_at,
    duration_mins,
    capacity,
    is_fully_booked,
    bookings_count,
    creator_name,
  } = session;

  const currentStatus = session.status ?? 'scheduled';
  const safeCapacity = capacity || 0;
  const spotsLeft = Math.max(0, safeCapacity - (bookings_count || 0));

  const date = formatDateTime(scheduled_at);
  const spanClasses = getGridSpanClasses(size);
  const badgeClasses = getStatusBadgeClasses(is_fully_booked, currentStatus);
  const badgeText = getReadableStatus(currentStatus, isFullyBooked, spotsLeft);

  const isFree = price == null || Number(price) === 0;

  return (
    <div 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${spanClasses}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-xl font-bold text-gray-900">
            {title}
          </h3>
          <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClasses}`}>
            {badgeText}
          </span>
        </div>

        <p className="mb-4 text-sm font-medium text-gray-500">
          by <span className="text-gray-700">{creator_name || 'Unknown'}</span>
        </p>

        {description && (
          <p className="mb-6 line-clamp-3 text-sm text-gray-600">
            {description}
          </p>
        )}

        <ul className="mb-6 mt-auto flex flex-col gap-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span aria-hidden="true">📅</span> 
            <span className="sr-only">Date and Time:</span>
            {date}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">⏱</span> 
            <span className="sr-only">Duration:</span>
            {duration_mins} mins
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">👥</span> 
            <span className="sr-only">Participants:</span>
            {bookings_count || 0}/{safeCapacity} participants
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xl font-extrabold text-indigo-600">
            {isFree ? 'Free' : `₹${price}`}
          </span>
          <Link 
            href={`/sessions/${id}`} 
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 active:bg-indigo-700"
            aria-label={`View details for ${title}`}
          >
            View Details
            <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scheduled_at: PropTypes.string.isRequired,
    duration_mins: PropTypes.number.isRequired,
    capacity: PropTypes.number,
    is_fully_booked: PropTypes.bool,
    bookings_count: PropTypes.number,
    creator_name: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  size: PropTypes.oneOf(['1x1', '2x1', '1x2', '2x2']),
};

export function SessionBentoGrid({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-lg text-gray-500">No sessions available at the moment.</p>
      </div>
    );
  }

  const bentoPattern = ['2x2', '1x1', '1x2', '2x1', '1x1', '1x1', '2x1', '1x2'];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 grid-flow-row-dense">
      {sessions.map((session, index) => {
        const assignedSize = bentoPattern[index % bentoPattern.length];
        return (
          <SessionCard 
            key={session.id} 
            session={session} 
            size={assignedSize} 
          />
        );
      })}
    </div>
  );
}

SessionBentoGrid.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object).isRequired,
};
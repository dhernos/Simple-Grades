import React from 'react';

const SessionTTL = ({ ttlInSeconds }) => {
  if (ttlInSeconds === undefined || ttlInSeconds < 0) {
    return null; // Zeigt nichts an, wenn TTL ungültig ist
  }

  const days = Math.floor(ttlInSeconds / (60 * 60 * 24));
  const hours = Math.floor((ttlInSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((ttlInSeconds % (60 * 60)) / 60);
  const seconds = ttlInSeconds % 60;

  return (
    <p>
      <span className="font-semibold">Verbleibende Zeit:</span>{" "}
      {days > 0 && `${days}d `}
      {hours > 0 && `${hours}h `}
      {minutes > 0 && `${minutes}m `}
      {`${seconds}s`}
    </p>
  );
};

export default SessionTTL;
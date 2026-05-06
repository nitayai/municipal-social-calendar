'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div style={{ padding: 24 }}>
      <h2>אירעה שגיאה בעמוד הפוסט</h2>
      <p>{error.message}</p>

      <button
        onClick={() => reset()}
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: '#2563eb',
          color: 'white',
          borderRadius: 6,
        }}
      >
        נסה שוב
      </button>
    </div>
  );
}

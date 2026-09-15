export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="h-9 w-48 bg-bg-surface-elevated rounded-sm mb-lg" />
      <div className="grid grid-cols-3 gap-md mb-xl">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-bg-surface border border-border-outline rounded-md" />
        ))}
      </div>
      <div className="h-64 bg-bg-surface border border-border-outline rounded-md" />
    </div>
  );
}

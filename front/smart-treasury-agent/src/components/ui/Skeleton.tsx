interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClass = "skeleton animate-pulse";

  const variantClass = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  }[variant];

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={24} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton width="100%" height={48} />
      <div className="space-y-2">
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || `${Math.round(percentage)}%`}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}


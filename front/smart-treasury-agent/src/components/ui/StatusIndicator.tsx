interface StatusIndicatorProps {
  status: "pending" | "running" | "completed" | "failed";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusIndicator({ status, showLabel = true, size = "md" }: StatusIndicatorProps) {
  const config = {
    pending: {
      color: "bg-yellow-500",
      label: "Pending",
      animate: "animate-pulse-slow",
    },
    running: {
      color: "bg-blue-500",
      label: "Running",
      animate: "animate-pulse",
    },
    completed: {
      color: "bg-green-500",
      label: "Completed",
      animate: "",
    },
    failed: {
      color: "bg-red-500",
      label: "Failed",
      animate: "",
    },
  }[status];

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizeClasses[size]} ${config.color} rounded-full ${config.animate}`} />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      )}
    </div>
  );
}


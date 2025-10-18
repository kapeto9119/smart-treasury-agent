"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./Card";
import { AnimatedNumber } from "../animations/AnimatedNumber";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  iconColor?: string;
  gradient?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  gradient,
}: StatCardProps) {
  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Extract number from currency string for animation
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="relative overflow-hidden group shadow-sm hover:shadow-xl transition-shadow duration-300">
        {gradient && (
          <motion.div
            className={`absolute inset-0 opacity-5 ${gradient}`}
            animate={{
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {title}
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {typeof value === "string" && value.includes("$") ? (
                  <>
                    $
                    <AnimatedNumber
                      value={numericValue}
                      format={(num) => num.toLocaleString()}
                    />
                  </>
                ) : (
                  value
                )}
              </h3>
              {change && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-1"
                >
                  <span
                    className={`text-sm font-medium ${getTrendColor(
                      change.trend
                    )}`}
                  >
                    {change.trend === "up" && "↑"}
                    {change.trend === "down" && "↓"}
                    {change.value}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    vs last week
                  </span>
                </motion.div>
              )}
            </div>
            {Icon && (
              <motion.div
                className={`w-12 h-12 rounded-xl ${
                  iconColor || "bg-blue-100 dark:bg-blue-900/30"
                } flex items-center justify-center`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    iconColor
                      ? "text-white"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

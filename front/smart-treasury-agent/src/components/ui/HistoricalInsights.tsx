"use client";

import React from "react";
import { Brain, TrendingUp, Target, Activity } from "lucide-react";

interface HistoricalInsightsProps {
  adjustmentReason?: string;
  originalConfidence?: number;
  adjustedConfidence?: number;
}

export default function HistoricalInsights({
  adjustmentReason,
  originalConfidence,
  adjustedConfidence,
}: HistoricalInsightsProps) {
  // Parse the adjustment reason to extract metrics
  const hasAdjustment =
    originalConfidence !== undefined && adjustedConfidence !== undefined;
  const confidenceDiff = hasAdjustment
    ? adjustedConfidence - originalConfidence
    : 0;
  const isPositive = confidenceDiff > 0;
  const isNegative = confidenceDiff < 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Brain className="w-5 h-5 text-indigo-500" />
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Historical Learning
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Confidence adjusted based on past performance
          </p>
        </div>
      </div>

      {/* Confidence Adjustment */}
      {hasAdjustment && (
        <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confidence Adjustment
            </span>
            <span
              className={`flex items-center gap-1 text-sm font-bold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : isNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {isPositive && "+"}
              {(confidenceDiff * 100).toFixed(1)}%
              {isPositive && <TrendingUp className="w-4 h-4" />}
              {isNegative && <Activity className="w-4 h-4" />}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Original
                </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {(originalConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 dark:bg-gray-500 h-2 rounded-full"
                  style={{ width: `${originalConfidence * 100}%` }}
                />
              </div>
            </div>

            <div className="text-2xl text-gray-400">→</div>

            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Adjusted
                </span>
                <span
                  className={`font-semibold ${
                    isPositive
                      ? "text-green-600 dark:text-green-400"
                      : isNegative
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {(adjustedConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    isPositive
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : isNegative
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                  }`}
                  style={{ width: `${adjustedConfidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      {adjustmentReason && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Learning Insight
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {adjustmentReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-200">
          This system learns from past recommendations to improve accuracy over
          time. Confidence scores are automatically adjusted based on historical
          performance.
        </p>
      </div>
    </div>
  );
}


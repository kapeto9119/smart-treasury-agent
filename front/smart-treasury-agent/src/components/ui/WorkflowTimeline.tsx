"use client";

import React from "react";
import {
  Database,
  TrendingUp,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";

interface WorkflowStep {
  agent: string;
  action: string;
  reasoning: string;
  output: any;
  timestamp: string;
}

interface WorkflowTimelineProps {
  workflow: WorkflowStep[];
  finalRecommendation: string;
  confidence: number;
}

const agentIcons: Record<string, any> = {
  "Data Collector": Database,
  "Historical Analyzer": TrendingUp,
  "Scenario Evaluator": Search,
  "Decision Maker": CheckCircle,
};

const agentColors: Record<
  string,
  { bg: string; border: string; text: string; icon: string }
> = {
  "Data Collector": {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 dark:bg-blue-900",
  },
  "Historical Analyzer": {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: "bg-green-100 dark:bg-green-900",
  },
  "Scenario Evaluator": {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: "bg-amber-100 dark:bg-amber-900",
  },
  "Decision Maker": {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    icon: "bg-purple-100 dark:bg-purple-900",
  },
};

export default function WorkflowTimeline({
  workflow,
  finalRecommendation,
  confidence,
}: WorkflowTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Clock className="w-6 h-6 text-indigo-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agentic Workflow
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            4-agent pipeline analysis
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-purple-500 dark:from-blue-800 dark:via-purple-800 dark:to-purple-600" />

        {/* Steps */}
        <div className="space-y-6">
          {workflow.map((step, idx) => {
            const Icon = agentIcons[step.agent] || Database;
            const colors = agentColors[step.agent] || agentColors["Data Collector"];
            const isLast = idx === workflow.length - 1;

            return (
              <div key={idx} className="relative pl-16">
                {/* Icon */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full ${colors.icon} border-4 border-white dark:border-gray-900 flex items-center justify-center z-10`}
                >
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                {/* Content */}
                <div
                  className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={`font-semibold ${colors.text}`}>
                        {step.agent}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 rounded">
                      Step {idx + 1}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {step.action.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reasoning
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.reasoning}
                      </p>
                    </div>

                    {/* Output Preview */}
                    {step.output && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Output
                        </p>
                        <div className="max-h-32 overflow-y-auto">
                          <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Decision Highlight */}
                  {isLast && (
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Final Recommendation
                      </p>
                      <p className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        {finalRecommendation}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {workflow.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Agents
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {(confidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Confidence
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {Math.round(
              (new Date(workflow[workflow.length - 1].timestamp).getTime() -
                new Date(workflow[0].timestamp).getTime()) /
                1000
            )}
            s
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Duration
          </div>
        </div>
      </div>
    </div>
  );
}


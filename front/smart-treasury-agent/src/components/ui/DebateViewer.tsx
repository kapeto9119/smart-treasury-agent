"use client";

import React from "react";
import { Shield, TrendingUp, Scale, MessageSquare } from "lucide-react";

interface AgentOpinion {
  agent: string;
  stance: string;
  reasoning: string;
  confidence: number;
  proposedTransfer: number;
}

interface DebateData {
  conservative: AgentOpinion;
  aggressive: AgentOpinion;
  mediatorSynthesis: string;
}

interface DebateViewerProps {
  debate: DebateData;
  finalRecommendation: string;
  finalConfidence: number;
}

export default function DebateViewer({
  debate,
  finalRecommendation,
  finalConfidence,
}: DebateViewerProps) {
  const agents = [
    {
      ...debate.conservative,
      icon: Shield,
      color: "blue",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-700 dark:text-blue-300",
      iconBg: "bg-blue-100 dark:bg-blue-900",
    },
    {
      ...debate.aggressive,
      icon: TrendingUp,
      color: "orange",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      textColor: "text-orange-700 dark:text-orange-300",
      iconBg: "bg-orange-100 dark:bg-orange-900",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <MessageSquare className="w-6 h-6 text-purple-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Agent Debate
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Three AI agents analyzed this scenario
          </p>
        </div>
      </div>

      {/* Agent Opinions */}
      <div className="grid md:grid-cols-2 gap-4">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${agent.bgColor} ${agent.borderColor}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${agent.iconBg}`}>
                  <Icon className={`w-5 h-5 ${agent.textColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-semibold ${agent.textColor}`}
                    >
                      {agent.agent}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {(agent.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Proposed: ${agent.proposedTransfer.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stance */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Position
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {agent.stance}
                </p>
              </div>

              {/* Reasoning */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Reasoning
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {agent.reasoning}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mediator Synthesis */}
      <div className="p-5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
            <Scale className="w-5 h-5 text-purple-700 dark:text-purple-300" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
              Mediator (Balance Master)
            </h4>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
              Synthesized both perspectives
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {(finalConfidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Synthesis
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {debate.mediatorSynthesis}
            </p>
          </div>

          <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Final Decision
            </p>
            <p className="text-base font-semibold text-purple-900 dark:text-purple-100">
              {finalRecommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Summary */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${debate.conservative.proposedTransfer.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Conservative
          </div>
        </div>
        <div className="text-2xl text-gray-400">→</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            Final Choice
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {(finalConfidence * 100).toFixed(0)}% confidence
          </div>
        </div>
        <div className="text-2xl text-gray-400">←</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ${debate.aggressive.proposedTransfer.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Aggressive
          </div>
        </div>
      </div>
    </div>
  );
}


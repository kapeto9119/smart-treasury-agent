import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Badge } from "./Badge";
import { Brain, TrendingUp, Shield, Sparkles } from "lucide-react";
import type { AgentAnalysis } from "@/types";

interface AgentAnalysisCardProps {
  agent: AgentAnalysis;
  mode?: string;
}

export default function AgentAnalysisCard({
  agent,
  mode = "balanced",
}: AgentAnalysisCardProps) {
  // Get risk color based on assessment
  const getRiskColor = (assessment: string) => {
    const level = assessment.toUpperCase();
    if (level.includes("LOW"))
      return "bg-green-100 text-green-800 border-green-200";
    if (level.includes("MEDIUM"))
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (level.includes("HIGH")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  if (!agent.agentEnabled) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500">
            <Brain className="w-5 h-5" />
            AI Agent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Agent analysis not available</p>
            {agent.error && (
              <p className="text-xs text-red-500 mt-2">{agent.error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Brain className="w-5 h-5" />
            AI Agent Analysis
            <Sparkles className="w-4 h-4 text-purple-500" />
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 capitalize">
            {mode} Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confidence Score */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">
              Agent Confidence
            </p>
            <span
              className={`text-2xl font-bold ${getConfidenceColor(
                agent.confidence
              )}`}
            >
              {(agent.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                agent.confidence >= 0.8
                  ? "bg-green-500"
                  : agent.confidence >= 0.6
                  ? "bg-yellow-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${agent.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Agent Recommendation
              </p>
              <p className="text-gray-900 font-medium leading-relaxed">
                {agent.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-3">
            Agent Reasoning
          </p>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {agent.reasoning}
            </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Risk Assessment
              </p>
              <Badge
                className={`${getRiskColor(agent.riskAssessment)} text-sm`}
              >
                {agent.riskAssessment}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Analyzed in Daytona Sandbox
          </span>
          <span>Claude Sonnet 4</span>
        </div>
      </CardContent>
    </Card>
  );
}

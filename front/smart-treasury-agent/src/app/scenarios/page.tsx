"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPercent, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Brain, Sparkles } from "lucide-react";

export default function ScenariosPage() {
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["allScenarios"],
    queryFn: () => api.getRecentScenarios(50),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                All Scenarios
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View and compare all treasury simulation scenarios
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Link key={scenario.id} href={`/scenarios/${scenario.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize flex items-center gap-2">
                      {scenario.mode}
                      {scenario.metrics?.agent?.agentEnabled && (
                        <span title="AI Agent Analysis Available">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                        </span>
                      )}
                    </CardTitle>
                    <Badge className={getStatusColor(scenario.status)}>
                      {scenario.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {scenario.metrics ? (
                    <div className="space-y-3">
                      {/* Agent Confidence Badge */}
                      {scenario.metrics.agent?.agentEnabled && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-700">
                            AI Confidence:{" "}
                            {(scenario.metrics.agent.confidence * 100).toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Idle Cash</span>
                        <span className="font-semibold">
                          {formatPercent(scenario.metrics.idleCashPct)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Coverage Days
                        </span>
                        <span className="font-semibold">
                          {scenario.metrics.liquidityCoverageDays.toFixed(1)}{" "}
                          days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Yield</span>
                        <span className="font-semibold text-green-600">
                          {scenario.metrics.estYieldBps} bps
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk</span>
                        <span className="font-semibold text-red-600">
                          {formatPercent(scenario.metrics.shortfallRiskPct)}
                        </span>
                      </div>
                      {scenario.recommendation && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            {scenario.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {scenario.status === "failed"
                        ? "Simulation failed"
                        : "Processing..."}
                    </div>
                  )}
                  <div className="mt-4 text-xs text-gray-500">
                    {new Date(scenario.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

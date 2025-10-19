"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatCurrency,
  formatPercent,
  getStatusColor,
  getRiskColor,
} from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { use, useState } from "react";
import DebateViewer from "@/components/ui/DebateViewer";
import WorkflowTimeline from "@/components/ui/WorkflowTimeline";
import HistoricalInsights from "@/components/ui/HistoricalInsights";
import AgentAnalysisCard from "@/components/ui/AgentAnalysisCard";

export default function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const scenarioId = resolvedParams.id;
  const queryClient = useQueryClient();
  const [executing, setExecuting] = useState(false);

  const { data: scenario, isLoading } = useQuery({
    queryKey: ["scenario", scenarioId],
    queryFn: () => api.getScenario(scenarioId),
    refetchInterval: (query) => {
      return query.state.data?.status === "pending" ||
        query.state.data?.status === "running"
        ? 2000
        : false;
    },
  });

  const { data: evalLogs = [] } = useQuery({
    queryKey: ["evalLogs", scenarioId],
    queryFn: () => api.getEvalLogsByScenario(scenarioId),
    enabled: !!scenario && scenario.status === "completed",
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.getAccounts(),
  });

  const executeTransferMutation = useMutation({
    mutationFn: async () => {
      if (!scenario?.metrics?.transferDetails) {
        throw new Error("No transfer details available");
      }

      const fromAccount = accounts.find(
        (acc) => acc.name === scenario.metrics!.transferDetails!.fromAccount
      );
      const toAccount = accounts.find(
        (acc) => acc.name === scenario.metrics!.transferDetails!.toAccount
      );

      if (!fromAccount || !toAccount) {
        throw new Error("Account not found");
      }

      const transfer = await api.createTransfer({
        from_account_id: fromAccount.id,
        to_account_id: toAccount.id,
        amount: scenario.metrics!.transferDetails!.amount,
        currency: fromAccount.currency,
        scenario_id: scenarioId,
        notes: `Executed from ${scenario.mode} scenario`,
      });

      return api.executeTransfer(transfer.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      setExecuting(false);
      alert("Transfer executed successfully!");
    },
    onError: (error) => {
      setExecuting(false);
      alert(`Failed to execute transfer: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Scenario Not Found
          </h2>
          <Link href="/" className="mt-4 inline-block">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
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
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 capitalize">
                  {scenario.mode} Scenario
                </h1>
                <Badge className={getStatusColor(scenario.status)}>
                  {scenario.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Created {new Date(scenario.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics */}
            {scenario.metrics ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Idle Cash</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatPercent(scenario.metrics.idleCashPct)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Liquidity Coverage
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {scenario.metrics.liquidityCoverageDays.toFixed(1)}{" "}
                          days
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Estimated Yield
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {scenario.metrics.estYieldBps} bps
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Shortfall Risk
                        </p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatPercent(scenario.metrics.shortfallRiskPct)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Agent Analysis - NEW! */}
                {scenario.metrics.agent && (
                  <AgentAnalysisCard
                    agent={scenario.metrics.agent}
                    mode={scenario.mode}
                  />
                )}

                {/* Recommendation */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <TrendingUp className="w-5 h-5 inline mr-2" />
                      Recommended Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-gray-900 dark:text-gray-100 font-medium mb-4">
                      {scenario.recommendation ||
                        scenario.metrics.recommendation}
                    </p>
                  </CardContent>
                  {scenario.metrics.transferDetails &&
                    scenario.metrics.transferDetails.amount > 0 && (
                      <CardFooter>
                        <Button
                          onClick={() => {
                            setExecuting(true);
                            executeTransferMutation.mutate();
                          }}
                          isLoading={
                            executing || executeTransferMutation.isPending
                          }
                          size="lg"
                          className="w-full"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Execute Transfer:{" "}
                          {formatCurrency(
                            scenario.metrics.transferDetails.amount
                          )}
                        </Button>
                      </CardFooter>
                    )}
                </Card>

                {/* AI Analysis - Smart Component Detection */}
                {scenario.claude_response && (() => {
                  // Try to parse as JSON to detect debate or workflow
                  try {
                    const parsed = JSON.parse(scenario.claude_response);

                    // Check for workflow (array of steps)
                    if (Array.isArray(parsed)) {
                      return (
                        <Card>
                          <CardContent className="pt-6">
                            <WorkflowTimeline
                              workflow={parsed}
                              finalRecommendation={scenario.recommendation || ""}
                              confidence={evalLogs[0]?.confidence || 0.85}
                            />
                          </CardContent>
                        </Card>
                      );
                    }

                    // Check for debate (has debate, conservative, or aggressive fields)
                    if (parsed.debate || parsed.conservative || parsed.aggressive) {
                      const debateData = parsed.debate || parsed;
                      return (
                        <Card>
                          <CardContent className="pt-6">
                            <DebateViewer
                              debate={debateData}
                              finalRecommendation={scenario.recommendation || ""}
                              finalConfidence={evalLogs[0]?.confidence || 0.85}
                            />
                          </CardContent>
                        </Card>
                      );
                    }
                  } catch (e) {
                    // Not JSON - continue to text parsing
                  }

                  // Check for multi-line JSON with DEBATE marker
                  if (scenario.claude_response.includes("=== MULTI-AGENT DEBATE ===")) {
                    try {
                      const parts = scenario.claude_response.split("=== MULTI-AGENT DEBATE ===");
                      const rationale = parts[0].trim();
                      const debateJson = parts[1].trim();
                      const parsed = JSON.parse(debateJson);
                      
                      return (
                        <div className="space-y-4">
                          {rationale && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  AI Rationale
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {rationale}
                                </p>
                              </CardContent>
                            </Card>
                          )}
                          <Card>
                            <CardContent className="pt-6">
                              <DebateViewer
                                debate={parsed}
                                finalRecommendation={scenario.recommendation || ""}
                                finalConfidence={evalLogs[0]?.confidence || 0.85}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      );
                    } catch (e) {
                      // Fallback to text
                    }
                  }

                  // Check for Historical Learning markers
                  const hasLearning = scenario.claude_response.includes("[Historical Learning:");
                  let learningReason = "";
                  let originalText = scenario.claude_response;

                  if (hasLearning) {
                    const match = scenario.claude_response.match(/\[Historical Learning: ([^\]]+)\]/);
                    if (match) {
                      learningReason = match[1];
                      originalText = scenario.claude_response.replace(match[0], "").trim();
                    }
                  }

                  // Standard text response
                  return (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            AI Analysis & Rationale
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                              {originalText}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Historical Learning Card */}
                      {hasLearning && learningReason && (
                        <Card>
                          <CardContent className="pt-6">
                            <HistoricalInsights
                              adjustmentReason={learningReason}
                              originalConfidence={0.85}
                              adjustedConfidence={evalLogs[0]?.confidence || 0.85}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {scenario.status === "failed"
                      ? "Simulation failed"
                      : "Simulation in progress..."}
                  </p>
                  {scenario.error_message && (
                    <p className="text-sm text-red-600 mt-2">
                      {scenario.error_message}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Evaluation */}
            {evalLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Evaluation (Galileo)</CardTitle>
                </CardHeader>
                <CardContent>
                  {evalLogs.map((log) => (
                    <div key={log.id} className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Confidence Score
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full"
                              style={{ width: `${log.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {(log.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Risk Assessment
                        </p>
                        <Badge className={getRiskColor(log.risk_flag)}>
                          {log.risk_flag.toUpperCase()} RISK
                        </Badge>
                      </div>
                      {log.notes && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Notes</p>
                          <p className="text-sm text-gray-700">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Scenario Info */}
            <Card>
              <CardHeader>
                <CardTitle>Scenario Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Mode</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {scenario.mode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(scenario.status)}>
                      {scenario.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(scenario.created_at).toLocaleString()}
                    </p>
                  </div>
                  {scenario.completed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-sm text-gray-900">
                        {new Date(scenario.completed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {scenario.sandbox_id && (
                    <div>
                      <p className="text-sm text-gray-600">Sandbox ID</p>
                      <p className="text-xs text-gray-900 font-mono break-all">
                        {scenario.sandbox_id}
                      </p>
                    </div>
                  )}
                  {scenario.preview_url && (
                    <div>
                      <a
                        href={scenario.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Daytona Preview →
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

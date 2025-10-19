"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { AnimatedButton } from "@/components/animations/AnimatedButton";
import { ScenarioConfigModal } from "@/components/ui/ScenarioConfigModal";
import {
  AnimatedList,
  AnimatedListItem,
} from "@/components/animations/AnimatedCard";
import {
  PageTransition,
  SlideIn,
} from "@/components/animations/PageTransition";
import { LoadingSpinner } from "@/components/animations/LoadingSpinner";
import { formatCurrency, formatPercent, getStatusColor } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PlayCircle,
  DollarSign,
  Wallet,
  Activity,
  Sparkles,
  BarChart3,
  Clock,
  Brain,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [runningScenarios, setRunningScenarios] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fetch data
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.getAccounts(),
  });

  const { data: forecast = [], isLoading: forecastLoading } = useQuery({
    queryKey: ["forecast"],
    queryFn: () => api.getForecast(7),
  });

  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ["policy"],
    queryFn: () => api.getActivePolicy(),
  });

  const { data: recentScenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => api.getRecentScenarios(6),
    refetchInterval: runningScenarios ? 2000 : false,
  });

  // Run scenarios mutation
  const runScenariosMutation = useMutation({
    mutationFn: (config?: any) =>
      config
        ? api.runScenariosWithConfig(config)
        : api.runScenarios(["conservative", "balanced", "aggressive"]),
    onSuccess: (data) => {
      data.scenarioIds;
      setRunningScenarios(true);
      setShowConfigModal(false);
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });

      // Check status every 2 seconds
      const checkInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      }, 2000);

      // Stop checking after 60 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setRunningScenarios(false);
      }, 60000);
    },
  });

  // Calculate totals
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const next7DaysInflow = forecast.reduce((sum, f) => sum + f.inflow, 0);
  const next7DaysOutflow = forecast.reduce((sum, f) => sum + f.outflow, 0);
  const netCashFlow = next7DaysInflow - next7DaysOutflow;
  const avgDailyOutflow = next7DaysOutflow / 7;
  const liquidityDays = avgDailyOutflow > 0 ? totalCash / avgDailyOutflow : 999;

  const isLoading = accountsLoading || forecastLoading || policyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner size={64} />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-gray-600 dark:text-gray-400 text-lg"
          >
            Loading your treasury dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <SlideIn direction="left">
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Smart Treasury Agent
                  </h1>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-13">
                  AI-powered cash management & scenario planning
                </p>
              </SlideIn>
              <SlideIn direction="right">
                <div className="flex items-center gap-3">
                  <Link href="/scenarios/activity">
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:shadow-md transition-all duration-300"
                    >
                      <Activity className="w-5 h-5 mr-2" />
                      Activity Monitor
                    </Button>
                  </Link>
                  <AnimatedButton
                    onClick={() => setShowConfigModal(true)}
                    isLoading={
                      runScenariosMutation.isPending || runningScenarios
                    }
                    size="lg"
                    className="gradient-blue hover:shadow-lg transition-all duration-300"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Configure & Run
                  </AnimatedButton>
                </div>
              </SlideIn>
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.3,
                },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <StatCard
                title="Total Cash"
                value={formatCurrency(totalCash)}
                icon={DollarSign}
                iconColor="bg-gradient-blue"
                gradient="gradient-blue"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <StatCard
                title="7-Day Inflow"
                value={formatCurrency(next7DaysInflow)}
                change={{
                  value: "+12.5%",
                  trend: "up",
                }}
                icon={ArrowUpRight}
                iconColor="bg-gradient-success"
                gradient="gradient-success"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <StatCard
                title="7-Day Outflow"
                value={formatCurrency(next7DaysOutflow)}
                change={{
                  value: "-3.2%",
                  trend: "down",
                }}
                icon={ArrowDownRight}
                iconColor="bg-gradient-danger"
                gradient="gradient-danger"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <StatCard
                title="Net Position"
                value={formatCurrency(netCashFlow)}
                change={{
                  value: netCashFlow >= 0 ? "+5.4%" : "-2.1%",
                  trend: netCashFlow >= 0 ? "up" : "down",
                }}
                icon={netCashFlow >= 0 ? TrendingUp : TrendingDown}
                iconColor={
                  netCashFlow >= 0
                    ? "bg-gradient-success"
                    : "bg-gradient-warning"
                }
                gradient={
                  netCashFlow >= 0 ? "gradient-success" : "gradient-warning"
                }
              />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bank Accounts */}
              <Card className="card-hover animate-fade-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Bank Accounts</CardTitle>
                    </div>
                    <Badge variant="default">{accounts.length} accounts</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatedList className="space-y-3">
                    {accounts.map((account, index) => (
                      <AnimatedListItem key={account.id}>
                        <div
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 hover:shadow-md transition-all duration-300"
                          style={{
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {account.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {account.account_type
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {account.bank} • {account.currency}
                              </p>
                              <div className="mt-3">
                                <ProgressBar
                                  value={account.balance}
                                  max={totalCash}
                                  color="blue"
                                  size="sm"
                                />
                              </div>
                            </div>
                            <div className="text-right ml-6">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(
                                  account.balance,
                                  account.currency
                                )}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatPercent(
                                  (account.balance / totalCash) * 100
                                )}{" "}
                                of total
                              </p>
                            </div>
                          </div>
                        </div>
                      </AnimatedListItem>
                    ))}
                  </AnimatedList>
                </CardContent>
              </Card>

              {/* Recent Scenarios */}
              <Card
                className="card-hover animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Recent Scenarios</CardTitle>
                    </div>
                    {recentScenarios.length > 0 && (
                      <Link href="/scenarios">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {recentScenarios.length === 0 ? (
                    <EmptyState
                      icon={AlertCircle}
                      title="No scenarios run yet"
                      description="Click 'Configure & Run' to generate AI-powered treasury recommendations"
                      action={{
                        label: "Configure & Run",
                        onClick: () => setShowConfigModal(true),
                      }}
                    />
                  ) : (
                    <AnimatedList className="space-y-3">
                      {recentScenarios.slice(0, 3).map((scenario, index) => (
                        <AnimatedListItem key={scenario.id}>
                          <Link
                            href={`/scenarios/${scenario.id}`}
                            className="block"
                            style={{
                              animationDelay: `${index * 100}ms`,
                            }}
                          >
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 hover:shadow-md transition-all duration-300 cursor-pointer">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <StatusIndicator
                                      status={scenario.status}
                                      showLabel={false}
                                    />
                                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                      {scenario.mode} Strategy
                                    </h4>
                                    <Badge
                                      className={getStatusColor(
                                        scenario.status
                                      )}
                                    >
                                      {scenario.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(
                                          scenario.created_at
                                        ).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {scenario.metrics?.idleCashPct !==
                                      undefined && (
                                      <span>
                                        Idle Cash:{" "}
                                        {formatPercent(
                                          scenario.metrics.idleCashPct
                                        )}
                                      </span>
                                    )}
                                    {scenario.metrics?.agent?.agentEnabled && (
                                      <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                                        <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                          {(
                                            scenario.metrics.agent.confidence *
                                            100
                                          ).toFixed(0)}
                                          %
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Activity className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                          </Link>
                        </AnimatedListItem>
                      ))}
                    </AnimatedList>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Policy & Forecast */}
            <div className="space-y-6">
              {/* Active Policy */}
              <Card
                className="card-hover animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Active Policy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {policy ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          {policy.name}
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Min Liquidity
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(policy.min_liquidity)}
                              </span>
                            </div>
                            <ProgressBar
                              value={totalCash}
                              max={policy.min_liquidity * 2}
                              color="green"
                              size="sm"
                            />
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Invest Above
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(policy.invest_above)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Risk Profile
                              </span>
                              <Badge variant="default" className="capitalize">
                                {policy.risk_profile}
                              </Badge>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Liquidity Coverage
                              </span>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {Math.round(liquidityDays)} days
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={AlertCircle}
                      title="No active policy"
                      description="Create a treasury policy to enable scenario analysis"
                    />
                  )}
                </CardContent>
              </Card>

              {/* 7-Day Forecast */}
              <Card
                className="card-hover animate-fade-in"
                style={{ animationDelay: "300ms" }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle>7-Day Forecast</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.slice(0, 7).map((day, index) => (
                      <div
                        key={day.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            +{formatCurrency(day.inflow)}
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            -{formatCurrency(day.outflow)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Scenario Configuration Modal */}
        <ScenarioConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onSubmit={(config) => runScenariosMutation.mutate(config)}
          isLoading={runScenariosMutation.isPending}
        />
      </div>
    </PageTransition>
  );
}

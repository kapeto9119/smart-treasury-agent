"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { formatPercent, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  TrendingUp,
  BarChart3,
  Zap,
} from "lucide-react";
import { PageTransition } from "@/components/animations/PageTransition";
import { LoadingSpinner } from "@/components/animations/LoadingSpinner";

export default function ActivityPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["scenarioStats"],
    queryFn: () => api.getScenarioStats(),
    refetchInterval: 2000, // Refresh every 2 seconds
  });

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
            Loading activity monitor...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No stats available</p>
      </div>
    );
  }

  const successRate =
    stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0.0";
  const isActive = stats.pending > 0 || stats.running > 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"
                      animate={
                        isActive
                          ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                      }}
                    >
                      <Activity className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Simulation Activity
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Real-time monitoring of treasury simulations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {isActive && (
                <Badge variant="success" className="animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
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
                title="Total Runs"
                value={stats.total.toString()}
                icon={BarChart3}
                iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
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
                title="Running"
                value={stats.running.toString()}
                icon={Loader}
                iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"
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
                title="Completed"
                value={stats.completed.toString()}
                icon={CheckCircle}
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
                title="Failed"
                value={stats.failed.toString()}
                icon={XCircle}
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
                title="Pending"
                value={stats.pending.toString()}
                icon={Clock}
                iconColor="bg-gradient-warning"
                gradient="gradient-warning"
              />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Progress & Metrics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overall Progress */}
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle>Overall Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Completion Rate
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total > 0
                          ? Math.round((stats.completed / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <ProgressBar
                      value={stats.completed}
                      max={stats.total}
                      color="purple"
                      size="lg"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Success Rate
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {successRate}%
                        </span>
                      </div>
                      {stats.avgDurationSeconds && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Avg Duration
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {stats.avgDurationSeconds.toFixed(1)}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Running
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {stats.running}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Completed
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {stats.completed}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Failed
                        </span>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {stats.failed}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Pending
                        </span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.pending}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Recent Activity Feed */}
            <div className="lg:col-span-2">
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle>Recent Activity</CardTitle>
                    </div>
                    <Badge variant="info">
                      Last {stats.recentActivity.length} runs
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {stats.recentActivity.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No scenarios run yet</p>
                      </div>
                    ) : (
                      stats.recentActivity.map((scenario, index) => (
                        <motion.div
                          key={scenario.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link href={`/scenarios/${scenario.id}`}>
                            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 hover:shadow-md transition-all duration-300 cursor-pointer">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <StatusIndicator
                                      status={scenario.status}
                                      showLabel={false}
                                    />
                                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                      {scenario.mode} Strategy
                                    </h4>
                                  </div>
                                  <Badge
                                    className={getStatusColor(scenario.status)}
                                  >
                                    {scenario.status}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(
                                          scenario.created_at
                                        ).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {scenario.completed_at && (
                                      <span className="text-xs">
                                        Duration:{" "}
                                        {(
                                          (new Date(
                                            scenario.completed_at
                                          ).getTime() -
                                            new Date(
                                              scenario.created_at
                                            ).getTime()) /
                                          1000
                                        ).toFixed(1)}
                                        s
                                      </span>
                                    )}
                                  </div>

                                  {scenario.metrics && (
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500">
                                        Idle:{" "}
                                        {formatPercent(
                                          scenario.metrics.idleCashPct
                                        )}
                                      </span>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        {scenario.metrics.estYieldBps} bps
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {scenario.recommendation && (
                                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {scenario.recommendation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

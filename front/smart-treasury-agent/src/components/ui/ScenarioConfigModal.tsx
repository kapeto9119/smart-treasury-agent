"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import type { ScenarioConfig } from "@/types";
import { X, Sliders, Calendar, TrendingUp, DollarSign } from "lucide-react";

interface ScenarioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ScenarioConfig) => void;
  isLoading?: boolean;
}

export function ScenarioConfigModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ScenarioConfigModalProps) {
  const [config, setConfig] = useState<ScenarioConfig>({
    modes: ["conservative", "balanced", "aggressive"],
    parameters: {
      liquidityThresholdPct: 10,
      investmentHorizonDays: 7,
      riskAppetite: "medium",
    },
  });

  // Reset config when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig({
        modes: ["conservative", "balanced", "aggressive"],
        parameters: {
          liquidityThresholdPct: 10,
          investmentHorizonDays: 7,
          riskAppetite: "medium",
        },
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configure Scenario
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adjust parameters to customize your simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Liquidity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                <span>Liquidity Buffer</span>
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {config.parameters?.liquidityThresholdPct}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={config.parameters?.liquidityThresholdPct || 10}
              onChange={(e) =>
                setConfig({
                  ...config,
                  parameters: {
                    ...config.parameters,
                    liquidityThresholdPct: Number(e.target.value),
                  },
                })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maintain at least {config.parameters?.liquidityThresholdPct}% of
              cash as a safety buffer
            </p>
          </div>

          {/* Investment Horizon */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Investment Horizon</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 7, label: "7 Days", desc: "Short-term" },
                { value: 30, label: "30 Days", desc: "Standard" },
                { value: 90, label: "90 Days", desc: "Strategic" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      parameters: {
                        ...config.parameters,
                        investmentHorizonDays: option.value,
                      },
                    })
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    config.parameters?.investmentHorizonDays === option.value
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk Appetite */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <TrendingUp className="w-4 h-4" />
              <span>Risk Appetite</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: "low",
                  label: "Low",
                  desc: "Conservative",
                  color: "green",
                },
                {
                  value: "medium",
                  label: "Medium",
                  desc: "Balanced",
                  color: "blue",
                },
                {
                  value: "high",
                  label: "High",
                  desc: "Aggressive",
                  color: "red",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      parameters: {
                        ...config.parameters,
                        riskAppetite: option.value as "low" | "medium" | "high",
                      },
                    })
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    config.parameters?.riskAppetite === option.value
                      ? `border-${option.color}-600 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Modes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scenarios to Run
            </label>
            <div className="flex flex-wrap gap-3">
              {["conservative", "balanced", "aggressive"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    const newModes = config.modes.includes(mode)
                      ? config.modes.filter((m) => m !== mode)
                      : [...config.modes, mode];
                    setConfig({ ...config, modes: newModes });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all capitalize",
                    config.modes.includes(mode)
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select at least one scenario mode to run
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Configuration Summary
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                • Liquidity buffer: {config.parameters?.liquidityThresholdPct}%
              </li>
              <li>
                • Planning horizon: {config.parameters?.investmentHorizonDays}{" "}
                days
              </li>
              <li>
                • Risk appetite:{" "}
                <span className="capitalize">
                  {config.parameters?.riskAppetite}
                </span>
              </li>
              <li>• Running {config.modes.length} scenario(s)</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={config.modes.length === 0}
            >
              Run Scenarios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

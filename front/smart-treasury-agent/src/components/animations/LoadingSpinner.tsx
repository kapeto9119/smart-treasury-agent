"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="border-4 border-blue-200 border-t-blue-600 rounded-full"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

export function PulsingDot() {
  return (
    <motion.div
      className="w-3 h-3 bg-blue-600 rounded-full"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function LoadingDots() {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

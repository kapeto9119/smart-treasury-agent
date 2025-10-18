"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  format,
  className = "",
}: AnimatedNumberProps) {
  const spring = useSpring(0, { duration: 1000 });
  const display = useTransform(spring, (current) =>
    format ? format(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

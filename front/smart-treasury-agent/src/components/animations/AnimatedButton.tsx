"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { ComponentProps } from "react";

type AnimatedButtonProps = ComponentProps<typeof Button>;

export function AnimatedButton({ children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button {...props}>{children}</Button>
    </motion.div>
  );
}

"use client";

import { Button, Image } from "@heroui/react";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <div className="container mx-auto px-5 flex items-center justify-between my-20 lg:gap-8">
      <motion.div
        className="flex w-full lg:w-3/5 items-start justify-center flex-col"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1
          className="text-2xl md:text-[38px] font-semibold leading-snug"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Find The Medicines You<br></br>Need - Fast and Easy
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl max-w-[400px] mt-4 text-foreground-200"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Search available medicines and locate the nearest pharmacy
        </motion.p>
        <Link href="/signin" className="w-full max-w-[200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="mt-8 bg-secondary-200/45 font-medium text-md md:text-[17px]"
              size="lg"
              variant="shadow"
              radius="lg"
              fullWidth
            >
              Get Started
            </Button>
          </motion.div>
        </Link>
      </motion.div>
      <motion.div
        className="flex w-0 lg:w-2/5 items-center justify-end"
        initial={{ opacity: 0, scale: 0.8, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Image
          src="/images/hero.png"
          alt="Hero Image"
          radius="lg"
          className="max-h-[300px] object-cover"
          isBlurred
        />
      </motion.div>
    </div>
  );
};

export default HeroSection;


"use client";

import { Button, Image } from "@heroui/react";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

const stats = [
  { label: "Medicines Listed", value: "500+" },
  { label: "Pharmacies Connected", value: "100+" },
  { label: "Search Speed", value: "<5 sec" },
];

const HeroSection = () => {
  return (
    <div className="relative container mx-auto px-5 flex flex-col lg:flex-row items-center justify-between min-h-[100vh] lg:gap-8">
      {/* Subtle gradient background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-transparent" />

      {/* Left side - text and CTA */}
      <motion.div
        className="flex w-full lg:w-3/5 items-start justify-center flex-col pb-12 pt-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Tagline */}
        <p className="px-3 py-1 text-xs md:text-sm bg-primary/10 text-primary rounded-full mb-4">
          🚑 Your Trusted Local Medicine Finder
        </p>

        {/* Headline with black to green gradient */}
        <motion.h1
          className="text-3xl md:text-5xl font-bold leading-snug bg-gradient-to-r from-black to-[#4FAA84] text-transparent bg-clip-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Find The Medicine You need <br /> — Fast & Easy
        </motion.h1>

        {/* Description with green highlight */}
        <motion.p
          className="text-lg md:text-xl max-w-[500px] mt-4 text-gray-600"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Connect with <span className="font-semibold text-primary">nearby pharmacies</span>, 
          compare <span className="font-semibold text-[#4FAA84]">availability & prices</span>, 
          and get your medicines <span className="font-semibold text-green-600">faster</span>.
        </motion.p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="#medicines" className="w-full max-w-[200px]">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-primary text-white font-medium text-md md:text-lg shadow-md hover:shadow-lg transition-all"
                size="lg"
                variant="shadow"
                radius="lg"
                fullWidth
              >
                Find Medicines
              </Button>
            </motion.div>
          </Link>

          <Link href="#shops" className="w-full max-w-[200px]">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-secondary-100/70 border border-secondary-300 hover:bg-secondary-100 transition-all font-semibold text-neutral-00 text-lg px-28"
                size="lg"
                variant="flat"
                radius="lg"
                fullWidth
              >
                Nearby Medical Shops
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-12 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-left">
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right side - your uploaded illustration */}
      <motion.div
        className="hidden lg:flex w-2/5 items-center justify-end py-12"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Image
          src="/images/emergency-call-illustration.jpg"
          alt="Emergency telemedicine consultation"
          radius="lg"
          className="w-full h-full object-contain max-h-[600px] px-4"
          isBlurred
        />
      </motion.div>
    </div>
  );
};

export default HeroSection;
"use client";

import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { SiGeeksforgeeks } from "react-icons/si";
import { FiMail, FiUser, FiMessageSquare, FiPhone } from "react-icons/fi";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Input, Textarea, Card, CardBody } from "@heroui/react";
import emailjs from "@emailjs/browser";

const Footer = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // EmailJS configuration
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(
          "EmailJS configuration missing. Please check your environment variables."
        );
      }

      const templateParams = {
        from_name: form.name,
        from_email: form.email,
        message: form.message,
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      setSubmitStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Email sending error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const socialIconVariants = {
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.9 },
  };

  return (
    <footer
      id="contact"
      className="bg-gradient-to-br from-background via-green-50 to-green-100 text-primary py-16 px-6 md:px-20"
    >
      <motion.div
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-y-10 gap-x-10 items-start"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="space-y-2 md:col-span-1 text-base flex flex-col justify-start"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-bold text-primary mb-4">
            <span className="text-secondary-200">Medley</span>
          </h2>
          <p className="leading-relaxed max-w-sm text-foreground-200 mb-4">
            Find The Medicines You Need - Fast and Easy
          </p>
          <div className="space-y-2 text-foreground-200">
            <p>
              <a href="mailto:support@clickmeds.com">medley@teamsahayta.com</a>
            </p>
            <p>
              <FiPhone className="inline-block mr-2 text-secondary-200" />
              <a href="tel:+91 (22) 1234-5678">+91 (22) 1234-5678</a>
            </p>
            <p>Bhubaneswar, India</p>
          </div>
          <p className="mt-6 text-xs text-foreground-100">
            © 2025 Team Sahayta. All rights reserved.
          </p>
        </motion.div>

        <motion.div
          className="md:col-span-1 text-base flex flex-col justify-start"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold mb-5 text-primary">Follow Us</h2>
          <div className="flex space-x-6 text-3xl">
            <motion.a
              href="#"
              aria-label="Instagram"
              className="text-foreground-200 hover:text-pink-500 transition-colors duration-300"
              target="_blank"
              rel="noreferrer"
              variants={socialIconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FaInstagram />
            </motion.a>
            <motion.a
              href="#"
              aria-label="LinkedIn"
              className="text-foreground-200 hover:text-blue-600 transition-colors duration-300"
              target="_blank"
              rel="noreferrer"
              variants={socialIconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FaLinkedin />
            </motion.a>
            {/* <motion.a
              href="#"
              aria-label="GeeksforGeeks"
              className="text-foreground-200 hover:text-green-600 transition-colors duration-300"
              target="_blank"
              rel="noreferrer"
              variants={socialIconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <SiGeeksforgeeks />
            </motion.a> */}
            <motion.a
              href="#"
              aria-label="GitHub"
              className="text-foreground-200 hover:text-secondary-200 transition-colors duration-300"
              target="_blank"
              rel="noreferrer"
              variants={socialIconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FaGithub />
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          className="md:col-span-3 text-base max-w-3xl"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold mb-5 text-primary">Contact Us</h2>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-secondary-100/20">
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div
                  className="flex flex-col md:flex-row gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Input
                    type="text"
                    label="Your Name"
                    value={form.name}
                    onValueChange={(value) => handleInputChange("name", value)}
                    startContent={<FiUser className="text-secondary-200" />}
                    classNames={{
                      input: "text-primary",
                      label: "text-foreground-200",
                    }}
                    variant="bordered"
                    isRequired
                    className="w-full md:w-1/2"
                  />
                  <Input
                    type="email"
                    label="Your Email"
                    value={form.email}
                    onValueChange={(value) => handleInputChange("email", value)}
                    startContent={<FiMail className="text-secondary-200" />}
                    classNames={{
                      input: "text-primary",
                      label: "text-foreground-200",
                    }}
                    variant="bordered"
                    isRequired
                    className="w-full md:w-1/2"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Textarea
                    label="Your Message"
                    value={form.message}
                    onValueChange={(value) =>
                      handleInputChange("message", value)
                    }
                    startContent={
                      <FiMessageSquare className="text-secondary-200 mt-2" />
                    }
                    classNames={{
                      input: "text-primary",
                      label: "text-foreground-200",
                    }}
                    variant="bordered"
                    minRows={4}
                    maxRows={6}
                    isRequired
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    className={`w-full font-semibold transition-all duration-300 ${
                      submitStatus === "success"
                        ? "bg-green-600 text-white"
                        : submitStatus === "error"
                        ? "bg-red-600 text-white"
                        : "bg-gradient-to-r from-secondary-200 to-secondary-200/90 text-white hover:opacity-90"
                    }`}
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Sending..."
                      : submitStatus === "success"
                      ? "Message Sent! ✓"
                      : submitStatus === "error"
                      ? "Failed to send. Try again."
                      : "Send Message"}
                  </Button>

                  {submitStatus === "success" && (
                    <motion.p
                      className="text-green-600 text-sm mt-2 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Thank you for your message! We&apos;ll get back to you
                      soon.
                    </motion.p>
                  )}

                  {submitStatus === "error" && (
                    <motion.p
                      className="text-red-600 text-sm mt-2 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Please check your configuration and try again.
                    </motion.p>
                  )}
                </motion.div>
              </form>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;

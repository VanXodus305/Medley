"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { RiCloseLargeFill } from "react-icons/ri";
import { RxHamburgerMenu } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  // { label: "How It Works", href: "#how-it-works" },
  // { label: "Our Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

const NavBar = () => {
  const [activeSection, setActiveSection] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      let currentSection = "";

      navLinks.forEach(({ href }) => {
        const section: HTMLElement | null = document.querySelector(href);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;

          if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionTop + sectionHeight
          ) {
            currentSection = href.substring(1);
          }
        }
      });

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection]);

  const toggleMenu = () => {
    if (!isMenuOpen) {
      window.scrollTo(0, 0); // Scroll to the top when opening the menu
    }
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // const scrollToContact = (
  //   e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  // ) => {
  //   e.preventDefault(); // Prevent default jump behavior
  //   const footer = document.getElementById("contact"); // footer has id="contact"
  //   if (footer) {
  //     footer.scrollIntoView({ behavior: "smooth" });
  //   }
  //   setIsMenuOpen(false);
  // };

  const renderNavLinks = (onClickHandler?: () => void) =>
    navLinks.map(({ label }, index) => {
      return (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: onClickHandler ? index * 0.1 : 0,
          }}
        >
          {/* <Link
            href={href}
            className={`hover:text-secondary-200/70 transition-colors duration-300 ${
              activeSection === href.substring(1) ? "text-secondary-200" : ""
            }`}
            onClick={onClickHandler}
          >
            {label}
          </Link> */}
        </motion.div>
      );
    });

  return (
    <>
      <motion.nav
        className="w-full z-50 bg-background/50 fixed top-0 left-0 right-0 flex items-center justify-between py-5 md:py-7 md:px-10 px-4 backdrop-blur-3xl overflow-hidden shadow-sm"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-2xl font-semibold w-full justify-start items-center"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-secondary-200">Medley</span>
        </motion.div>

        <motion.div
          className="md:flex hidden text-center items-center justify-between w-full font-medium text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {renderNavLinks()}
        </motion.div>

        <motion.div
          className="md:flex hidden items-center justify-end w-full"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href="#chat" className="w-full max-w-[120px]">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-secondary-100/70 font-medium text-sm"
                size="sm"
                variant="shadow"
                fullWidth
              >
                Get Started
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          className="md:hidden flex items-center justify-end w-full"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="light"
              isIconOnly
              onPress={toggleMenu}
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
              className="text-2xl"
            >
              {isMenuOpen ? <RiCloseLargeFill /> : <RxHamburgerMenu />}
            </Button>
          </motion.div>
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 w-screen h-screen backdrop-blur-3xl z-40 bg-background/95 pt-20"
          >
            <div className="flex flex-col items-center justify-start h-full text-xl gap-8 mt-6">
              {renderNavLinks(closeMenu)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { RiCloseLargeFill } from "react-icons/ri";
import { RxHamburgerMenu } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface NavLink {
  label: string;
  href: string;
}

const homeNavLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Chat", href: "#chat" },
  { label: "Medicines", href: "#medicines" },
  { label: "Shops", href: "#shops" },
  { label: "Contact", href: "#contact" },
];

const customerNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/customer" },
  { label: "Medicines", href: "/customer" },
  { label: "Orders", href: "/customer/orders" },
];

const vendorNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/vendor" },
  { label: "Inventory", href: "/vendor/inventory" },
  { label: "Medicines", href: "/vendor/medicines" },
  { label: "Orders", href: "/vendor/orders" },
];

const authNavLinks: NavLink[] = []; // No nav links on login/register pages

const NavBar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine which nav links to show based on current page
  const getNavLinks = () => {
    if (pathname === "/") {
      return homeNavLinks;
    } else if (pathname.startsWith("/vendor")) {
      return vendorNavLinks;
    } else if (pathname.startsWith("/customer")) {
      return customerNavLinks;
    } else if (pathname === "/login" || pathname === "/register") {
      return authNavLinks;
    }
    return [];
  };

  const navLinks = getNavLinks();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  useEffect(() => {
    // Only track scroll positions on home page with anchor links
    const isHomePage = pathname === "/";
    if (!isHomePage || navLinks.length === 0) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      let currentSection = "";

      navLinks.forEach(({ href }) => {
        // Only process anchor links on home page
        if (href.startsWith("#")) {
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
        }
      });

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection, pathname, navLinks]);

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
    navLinks.map(({ href, label }, index) => {
      // Check if this is an anchor link (starts with #) or a regular page link
      const isAnchor = href.startsWith("#");
      const isActive = isAnchor
        ? activeSection === href.substring(1)
        : pathname === href || pathname.startsWith(href + "/");

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
          <Link
            href={href}
            className={`hover:text-secondary-200/70 transition-colors duration-300 ${
              isActive ? "text-secondary-200" : ""
            }`}
            onClick={onClickHandler}
          >
            {label}
          </Link>
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
        <Link href="/" className="w-1/5 justify-start items-center">
          <motion.div
            className="text-2xl font-semibold "
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-secondary-200">Medley</span>
          </motion.div>
        </Link>

        <motion.div
          className="md:flex hidden text-center items-center justify-evenly w-3/5 font-medium text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {renderNavLinks()}
        </motion.div>

        <motion.div
          className="md:flex hidden items-center justify-end w-1/5 gap-4"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {session ? (
            <Dropdown>
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform cursor-pointer"
                  color="success"
                  name={session.user?.name || "User"}
                  size="sm"
                  src={session.user?.image || ""}
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User Actions"
                className="min-w-[200px]"
                variant="flat"
              >
                <DropdownItem key="profile" isReadOnly className="gap-2 py-2">
                  <p className="font-semibold text-sm truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-default-400 truncate">
                    {session.user?.email}
                  </p>
                </DropdownItem>
                <DropdownItem
                  key="dashboard"
                  onClick={() => router.push("/customer")}
                  className="text-sm"
                >
                  Dashboard
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm"
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Link href="/login" className="w-full max-w-[120px]">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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
          )}
        </motion.div>

        {/* Mobile Avatar for smaller screens */}
        <motion.div
          className="md:hidden flex items-center justify-end gap-2"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {session && (
            <Dropdown>
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform cursor-pointer"
                  color="success"
                  name={session.user?.name || "User"}
                  size="sm"
                  src={session.user?.image || ""}
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User Actions"
                className="min-w-[180px]"
                variant="flat"
              >
                <DropdownItem key="profile" isReadOnly className="gap-2 py-2">
                  <p className="font-semibold text-xs truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-default-400 truncate">
                    {session.user?.email}
                  </p>
                </DropdownItem>
                <DropdownItem
                  key="dashboard"
                  onClick={() => router.push("/customer")}
                  className="text-xs"
                >
                  Dashboard
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs"
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
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

        {/* Hamburger for larger screens (fallback) */}
        <motion.div
          className="hidden md:hidden items-center justify-end w-full"
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
              <div className="h-px w-3/4 bg-default-200 my-4" />
              {!session && (
                <Link href="/login" className="w-3/4">
                  <Button
                    className="w-full bg-secondary-100/70 font-medium"
                    size="lg"
                    variant="shadow"
                    onClick={closeMenu}
                  >
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;

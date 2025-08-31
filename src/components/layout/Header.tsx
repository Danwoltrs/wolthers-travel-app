"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building,
    Users,
    Settings,
    Sun,
    Moon,
    Menu,
    X,
    User,
    LogOut,
    Plus,
  } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import UserManagementModal from "@/components/users/UserManagementModal";
import Image from "next/image";

// Custom Car icon component using the asset SVG
const CarIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 48 48"
    fill="currentColor"
  >
    <path d="M42 28h-2.5l-2-8c-0.5-2-2.3-3.5-4.4-3.5H14.9c-2.1 0-3.9 1.5-4.4 3.5l-2 8H6c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h2v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h16v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h2c1.1 0 2-0.9 2-2v-6c0-1.1-0.9-2-2-2zM12 32c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm24 0c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm4-10H8l1.5-6c0.2-0.8 0.9-1.5 1.8-1.5h25.4c0.9 0 1.6 0.7 1.8 1.5L40 22z" />
  </svg>
);

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: "Home", href: "/dashboard" },
  { icon: <CarIcon className="w-5 h-5" />, label: "Fleet", href: "/fleet" },
  {
    icon: <Building className="w-5 h-5" />,
    label: "Companies",
    href: "/companies",
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
    href: "/settings",
  },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
    const { user, signOut, isLoading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [showUserModal, setShowUserModal] = React.useState(false);
    const [showUserDropdown, setShowUserDropdown] = React.useState(false);

    // Determine if user can create trips
    const canCreateTrips = React.useMemo(() => {
      if (!user) return false;
      const isWolthersStaff =
        user.isGlobalAdmin ||
        user.companyId === "840783f4-866d-4bdb-9b5d-5d0facf62db0";
      if (isWolthersStaff) return true;
      return user.role === "admin";
    }, [user]);

  // Filter navigation items based on user permissions
  const getFilteredNavItems = () => {
    if (!user) return navItems;

    const isWolthersStaff =
      user.isGlobalAdmin ||
      user.companyId === "840783f4-866d-4bdb-9b5d-5d0facf62db0";

    return navItems.filter((item) => {
      // External users cannot access Fleet page but CAN access Companies (their own company dashboard)
      if (!isWolthersStaff) {
        if (item.href === "/fleet") {
          return false;
        }
      }
      return true;
    });
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("menuToggle", {
        detail: { isOpen: newState },
      }),
    );
  };

  // Use responsive padding to avoid horizontal overflow on small screens
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative bg-emerald-800/90 dark:bg-[#09261d]/95 backdrop-blur-xl rounded-full shadow-2xl border border-emerald-600/30 dark:border-emerald-900/60 px-6 sm:px-8 md:px-10 lg:px-12 py-6">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/30 to-emerald-900/30 dark:from-[#09261d]/60 dark:to-[#041611]/80 rounded-full" />

          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                src="/images/logos/wolthers-logo-off-white.svg"
                alt="Wolthers & Associates"
                width={160}
                height={43}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Icon Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {getFilteredNavItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "p-3 rounded-full transition-all duration-200 hover:scale-110",
                    pathname === item.href
                      ? "bg-white/20 dark:bg-emerald-500/20 text-white shadow-lg"
                      : "text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15",
                  )}
                >
                  {item.icon}
                </Link>
              ))}

              {/* Theme Toggle Switch - Smaller */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                className="relative ml-4"
              >
                <div
                  className={cn(
                    "w-8 h-4 rounded-full transition-all duration-300 ease-in-out",
                    theme === "dark" ? "bg-[#0E3D2F]" : "bg-white/30",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                      theme === "dark"
                        ? "translate-x-4 bg-white"
                        : "translate-x-0.5 bg-white",
                    )}
                  >
                    {theme === "dark" ? (
                      <Moon className="w-2 h-2 text-[#0E3D2F]" />
                    ) : (
                      <Sun className="w-2 h-2 text-amber-600" />
                    )}
                  </div>
                </div>
              </button>

              {/* User Profile Dropdown */}
              {user && !isLoading && (
                <div
                  className="relative ml-4"
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="flex items-center space-x-2 p-2 rounded-full text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200 cursor-pointer">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || user.email}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <div className="hidden md:block">
                      <div className="text-sm font-medium">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-emerald-200 dark:text-green-400">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full pt-1 z-50">
                      <div className="w-48 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-emerald-200 dark:border-emerald-900/60">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              setShowUserModal(true);
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-800/30 transition-colors duration-200 text-left"
                          >
                            <User className="w-4 h-4" />
                            <span>User Profile</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              signOut();
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-800/30 transition-colors duration-200 text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile Hamburger Menu */}
            <div className="lg:hidden flex items-center space-x-4">
              {/* Theme Toggle for Mobile - Smaller */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                className="relative"
              >
                <div
                  className={cn(
                    "w-8 h-4 rounded-full transition-all duration-300 ease-in-out",
                    theme === "dark" ? "bg-[#0E3D2F]" : "bg-white/30",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                      theme === "dark"
                        ? "translate-x-4 bg-white"
                        : "translate-x-0.5 bg-white",
                    )}
                  >
                    {theme === "dark" ? (
                      <Moon className="w-2 h-2 text-[#0E3D2F]" />
                    ) : (
                      <Sun className="w-2 h-2 text-amber-600" />
                    )}
                  </div>
                </div>
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMenu}
                className="p-3 rounded-full text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200"
                title="Menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 mx-4 sm:mx-6">
            <div className="bg-emerald-800/95 dark:bg-[#09261d]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-600/30 dark:border-emerald-900/60 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/30 to-emerald-900/30 dark:from-[#09261d]/60 dark:to-[#041611]/80" />
                <nav className="relative p-4 space-y-2">
                  {getFilteredNavItems().map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.dispatchEvent(
                        new CustomEvent("menuToggle", {
                          detail: { isOpen: false },
                        }),
                      );
                    }}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
                      pathname === item.href
                        ? "bg-white/20 dark:bg-emerald-500/20 text-white shadow-lg"
                        : "text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15",
                    )}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                  ))}

                  {/* Add Trip Button for Mobile */}
                  {canCreateTrips && (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("openTripCreation"));
                        setIsMenuOpen(false);
                        window.dispatchEvent(
                          new CustomEvent("menuToggle", {
                            detail: { isOpen: false },
                          }),
                        );
                      }}
                      className="flex items-center space-x-3 p-3 rounded-xl text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200 w-full text-left"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add Trip</span>
                    </button>
                  )}

                {/* User Profile for Mobile */}
                  {user && !isLoading && (
                    <button
                      onClick={() => {
                        setShowUserModal(true);
                        setIsMenuOpen(false);
                      window.dispatchEvent(
                        new CustomEvent("menuToggle", {
                          detail: { isOpen: false },
                        }),
                      );
                    }}
                    className="flex items-center space-x-3 p-3 rounded-xl text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200 w-full text-left"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">User Profile</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </header>
  );
}

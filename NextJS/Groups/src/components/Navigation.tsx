"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Menu, X, Home, Calendar, Settings } from "lucide-react";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground">Church Groups</span>
                <span className="text-xs text-muted-foreground -mt-1">Connect & Grow</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/groups"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
            >
              <Users className="w-4 h-4" />
              <span>Browse Groups</span>
            </Link>
            <Link
              href="/events"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>
            <Link
              href="/search"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>
          </div>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Link
              href="/groups/create"
              className="hidden sm:flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Start a Group</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="flex items-center space-x-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-3 rounded-md hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                href="/groups"
                className="flex items-center space-x-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-3 rounded-md hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="w-5 h-5" />
                <span>Browse Groups</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center space-x-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-3 rounded-md hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </Link>
              <Link
                href="/search"
                className="flex items-center space-x-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-3 rounded-md hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </Link>
              <Link
                href="/groups/create"
                className="flex items-center space-x-3 bg-primary text-primary-foreground px-3 py-3 rounded-md hover:bg-primary-hover transition-colors font-medium mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5" />
                <span>Start a Group</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Users, Calendar, MapPin, Heart, Star, Clock, TrendingUp } from "lucide-react";

const mockResults = [
  {
    id: 1,
    name: "Young Adults Bible Study",
    description: "Join us for deeper study of God's word, fellowship, and prayer. Perfect for ages 18-30.",
    category: "bible-study",
    schedule: "Thursdays, 7:00 PM",
    location: "Fellowship Hall",
    members: 12,
    maxMembers: 15,
    isAcceptingMembers: true,
    relevanceScore: 0.95
  },
  {
    id: 2,
    name: "Women's Life Group",
    description: "A supportive community for women to grow in faith, share life experiences, and build lasting friendships.",
    category: "life-groups",
    schedule: "Tuesdays, 10:00 AM",
    location: "Room 205",
    members: 8,
    maxMembers: 12,
    isAcceptingMembers: true,
    relevanceScore: 0.87
  },
  {
    id: 6,
    name: "Senior Saints Fellowship",
    description: "Fellowship, encouragement, and activities for our senior community members.",
    category: "special-interest",
    schedule: "Wednesdays, 2:00 PM",
    location: "Community Room",
    members: 14,
    maxMembers: 25,
    isAcceptingMembers: true,
    relevanceScore: 0.72
  }
];

const popularSearches = [
  "Bible study",
  "Young adults",
  "Women's ministry",
  "Prayer group",
  "Family activities",
  "Men's fellowship",
  "Youth group",
  "Senior activities"
];

const recentSearches = [
  "young adults",
  "prayer",
  "bible study"
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term: string) => {
    if (!term.trim()) return;

    setIsSearching(true);
    setSearchTerm(term);

    // Simulate search delay
    setTimeout(() => {
      setHasSearched(true);
      setIsSearching(false);
    }, 800);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bible-study": return Users;
      case "life-groups": return Heart;
      case "ministry": return Star;
      case "special-interest": return Clock;
      default: return Users;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bible-study": return "bg-primary text-primary-foreground";
      case "life-groups": return "bg-church-secondary text-secondary-foreground";
      case "ministry": return "bg-church-accent text-accent-foreground";
      case "special-interest": return "bg-church-warm text-secondary-foreground";
      default: return "bg-primary text-primary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-hover to-accent text-primary-foreground py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Search Groups</h1>
            <p className="text-xl text-primary-foreground/90">
              Find the perfect group for your interests and schedule
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for groups, activities, or topics..."
                className="w-full pl-16 pr-6 py-6 bg-card border border-white/20 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-lg"
              />
              <button
                type="submit"
                disabled={!searchTerm.trim() || isSearching}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!hasSearched ? (
          /* Initial State */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Popular Searches */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-primary" />
                Popular Searches
              </h2>
              <div className="space-y-3">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-group-card-hover hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{search}</span>
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-primary" />
                Recent Searches
              </h2>
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-group-card-hover hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{search}</span>
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/groups"
                    className="block p-3 bg-card border border-border rounded-xl hover:bg-group-card-hover transition-colors"
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-primary mr-3" />
                      <span className="text-foreground font-medium">Browse All Groups</span>
                    </div>
                  </Link>
                  <Link
                    href="/groups/create"
                    className="block p-3 bg-card border border-border rounded-xl hover:bg-group-card-hover transition-colors"
                  >
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-primary mr-3" />
                      <span className="text-foreground font-medium">Start a New Group</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Search Results for "{searchTerm}"
                </h2>
                <p className="text-muted-foreground">
                  Found {mockResults.length} {mockResults.length === 1 ? 'group' : 'groups'}
                </p>
              </div>
              <button
                onClick={() => {
                  setHasSearched(false);
                  setSearchTerm("");
                }}
                className="text-primary hover:text-primary-hover transition-colors font-medium"
              >
                New Search
              </button>
            </div>

            {mockResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockResults.map((group) => {
                  const Icon = getCategoryIcon(group.category);
                  return (
                    <div
                      key={group.id}
                      className="bg-group-card-bg border border-group-card-border rounded-2xl p-6 hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${getCategoryColor(group.category)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center space-x-1 bg-group-status-active/10 text-group-status-active px-3 py-1 rounded-full text-sm font-medium">
                          <div className="w-2 h-2 bg-group-status-active rounded-full"></div>
                          <span>Open</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-foreground mb-3">{group.name}</h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{group.description}</p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{group.schedule}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{group.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{group.members} / {group.maxMembers} members</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {Math.round(group.relevanceScore * 100)}% match
                        </div>
                        <Link
                          href={`/groups/${group.id}`}
                          className="bg-primary text-primary-foreground px-6 py-2 rounded-xl hover:bg-primary-hover transition-colors font-medium"
                        >
                          View Group
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* No Results */
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No groups found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any groups matching "{searchTerm}". Try different keywords or browse all groups.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/groups"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Browse All Groups
                  </Link>
                  <Link
                    href="/groups/create"
                    className="inline-flex items-center px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Start a New Group
                  </Link>
                </div>
              </div>
            )}

            {/* Search Tips */}
            <div className="mt-12 bg-muted/50 border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Search Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Try searching for:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Group names or topics</li>
                    <li>• Age groups (young adults, seniors)</li>
                    <li>• Activities (bible study, fellowship)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Search examples:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• "bible study"</li>
                    <li>• "women's ministry"</li>
                    <li>• "young adults"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
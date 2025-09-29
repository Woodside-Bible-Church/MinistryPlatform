"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Users, Calendar, MapPin, Heart, Star, Clock, ChevronDown, X } from "lucide-react";

const mockGroups = [
  {
    id: 1,
    name: "Young Adults Bible Study",
    description: "Join us for deeper study of God's word, fellowship, and prayer. Perfect for ages 18-30.",
    category: "bible-study",
    schedule: "Thursdays, 7:00 PM",
    location: "Fellowship Hall",
    members: 12,
    maxMembers: 15,
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "Sarah Johnson",
    isAcceptingMembers: true
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
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "Mary Williams",
    isAcceptingMembers: true
  },
  {
    id: 3,
    name: "Family Ministry",
    description: "Activities and fellowship for families with children. Building strong family foundations through faith.",
    category: "ministry",
    schedule: "Sundays, 11:30 AM",
    location: "Children's Wing",
    members: 15,
    maxMembers: 20,
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "Mike & Jennifer Davis",
    isAcceptingMembers: true
  },
  {
    id: 4,
    name: "Men's Prayer Breakfast",
    description: "Start your week with prayer, fellowship, and encouragement with other men of faith.",
    category: "bible-study",
    schedule: "Mondays, 6:30 AM",
    location: "Main Sanctuary",
    members: 20,
    maxMembers: 25,
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "David Thompson",
    isAcceptingMembers: true
  },
  {
    id: 5,
    name: "Teen Youth Group",
    description: "Fun activities, meaningful discussions, and spiritual growth for teenagers.",
    category: "life-groups",
    schedule: "Fridays, 7:00 PM",
    location: "Youth Center",
    members: 18,
    maxMembers: 20,
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "Pastor Josh",
    isAcceptingMembers: false
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
    status: "active",
    image: "/api/placeholder/300/200",
    leader: "Eleanor Roberts",
    isAcceptingMembers: true
  }
];

const categories = [
  { id: "all", name: "All Groups", icon: Users },
  { id: "bible-study", name: "Bible Study", icon: Users },
  { id: "life-groups", name: "Life Groups", icon: Heart },
  { id: "ministry", name: "Ministry", icon: Star },
  { id: "special-interest", name: "Special Interest", icon: Clock }
];

const schedules = [
  "All Times",
  "Morning (6:00 AM - 12:00 PM)",
  "Afternoon (12:00 PM - 6:00 PM)",
  "Evening (6:00 PM - 10:00 PM)"
];

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSchedule, setSelectedSchedule] = useState("All Times");
  const [showFilters, setShowFilters] = useState(false);
  const [acceptingMembersOnly, setAcceptingMembersOnly] = useState(false);

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || group.category === selectedCategory;
    const matchesAccepting = !acceptingMembersOnly || group.isAcceptingMembers;

    let matchesSchedule = true;
    if (selectedSchedule !== "All Times") {
      const scheduleTime = group.schedule.toLowerCase();
      if (selectedSchedule.includes("Morning") && !(scheduleTime.includes("am") && !scheduleTime.includes("pm"))) {
        matchesSchedule = false;
      } else if (selectedSchedule.includes("Afternoon") && !(scheduleTime.includes("pm") && (scheduleTime.includes("12:") || scheduleTime.includes("1:") || scheduleTime.includes("2:") || scheduleTime.includes("3:") || scheduleTime.includes("4:") || scheduleTime.includes("5:")))) {
        matchesSchedule = false;
      } else if (selectedSchedule.includes("Evening") && !(scheduleTime.includes("pm") && (scheduleTime.includes("6:") || scheduleTime.includes("7:") || scheduleTime.includes("8:") || scheduleTime.includes("9:")))) {
        matchesSchedule = false;
      }
    }

    return matchesSearch && matchesCategory && matchesAccepting && matchesSchedule;
  });

  const getStatusBadge = (group: any) => {
    if (!group.isAcceptingMembers) {
      return (
        <div className="flex items-center space-x-1 bg-group-status-full/10 text-group-status-full px-3 py-1 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-group-status-full rounded-full"></div>
          <span>Full</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1 bg-group-status-active/10 text-group-status-active px-3 py-1 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-group-status-active rounded-full"></div>
        <span>Open</span>
      </div>
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    if (!categoryData) return Users;
    return categoryData.icon;
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
      <div className="bg-gradient-to-r from-primary via-primary-hover to-accent text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Browse Groups</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Find the perfect group to connect, grow, and serve together in community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search groups by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="text-muted-foreground">
              {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'} found
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-border space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Schedule</h3>
                <div className="flex flex-wrap gap-2">
                  {schedules.map((schedule) => (
                    <button
                      key={schedule}
                      onClick={() => setSelectedSchedule(schedule)}
                      className={`px-4 py-2 rounded-xl border transition-colors ${
                        selectedSchedule === schedule
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {schedule}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Options</h3>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptingMembersOnly}
                    onChange={(e) => setAcceptingMembersOnly(e.target.checked)}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-foreground">Accepting new members only</span>
                </label>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedSchedule("All Times");
                    setAcceptingMembersOnly(false);
                  }}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Clear all filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGroups.map((group) => {
            const Icon = getCategoryIcon(group.category);
            return (
              <div
                key={group.id}
                className="group bg-group-card-bg border border-group-card-border rounded-2xl overflow-hidden hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                {/* Group Image */}
                <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <div className={`p-3 rounded-xl ${getCategoryColor(group.category)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(group)}
                  </div>
                </div>

                {/* Group Content */}
                <div className="p-6">
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

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Led by <span className="font-medium text-foreground">{group.leader}</span>
                    </div>
                  </div>

                  <Link
                    href={`/groups/${group.id}`}
                    className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium"
                  >
                    {group.isAcceptingMembers ? 'Join Group' : 'Learn More'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any groups matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSchedule("All Times");
                setAcceptingMembersOnly(false);
              }}
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Don't see what you're looking for?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Have an idea for a new group? Start your own and invite others to join you in building community around shared interests and faith.
          </p>
          <Link
            href="/groups/create"
            className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-colors"
          >
            Start a New Group
            <Users className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
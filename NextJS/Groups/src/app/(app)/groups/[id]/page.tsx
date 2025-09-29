"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, MapPin, Clock, Mail, Phone, Heart, Star, Share2, Edit, UserPlus, CheckCircle } from "lucide-react";

// Mock data - in a real app, this would come from props/API
const mockGroup = {
  id: 1,
  name: "Young Adults Bible Study",
  description: "Join us for deeper study of God's word, fellowship, and prayer. We meet weekly to explore scripture, discuss life applications, and support one another in our faith journey. This group is perfect for ages 18-30 who are looking to grow spiritually and build meaningful relationships.",
  category: "bible-study",
  schedule: "Thursdays, 7:00 PM - 9:00 PM",
  location: "Fellowship Hall",
  address: "123 Church Street, Community Room B",
  members: 12,
  maxMembers: 15,
  status: "active",
  leader: {
    name: "Sarah Johnson",
    email: "sarah.johnson@church.com",
    phone: "(555) 123-4567",
    bio: "Sarah has been leading small groups for over 5 years and has a passion for helping young adults grow in their faith journey."
  },
  isAcceptingMembers: true,
  nextMeeting: "Thursday, October 26, 2023",
  startDate: "September 2023",
  image: "/api/placeholder/600/300",
  highlights: [
    "Interactive Bible study sessions",
    "Prayer and fellowship time",
    "Monthly social activities",
    "Mentorship opportunities"
  ],
  requirements: [
    "Ages 18-30",
    "Commitment to weekly attendance",
    "Open heart to learn and grow",
    "Respect for group confidentiality"
  ],
  recentEvents: [
    {
      title: "Fall Retreat Planning",
      date: "October 19, 2023",
      description: "Discussed upcoming retreat and volunteer opportunities"
    },
    {
      title: "Romans Study - Week 4",
      date: "October 12, 2023",
      description: "Explored Romans 8 and the power of the Spirit"
    },
    {
      title: "Welcome New Members",
      date: "October 5, 2023",
      description: "Welcomed two new members to our growing community"
    }
  ]
};

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleJoinGroup = () => {
    setShowJoinModal(true);
  };

  const confirmJoin = () => {
    setHasJoined(true);
    setShowJoinModal(false);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bible-study": return Users;
      case "life-groups": return Heart;
      case "ministry": return Star;
      case "special-interest": return Clock;
      default: return Users;
    }
  };

  const Icon = getCategoryIcon(mockGroup.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-hover to-accent text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/groups"
            className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-xl ${getCategoryColor(mockGroup.category)}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex items-center space-x-1 bg-group-status-active/20 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                  <span>Open for New Members</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{mockGroup.name}</h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                {mockGroup.description}
              </p>
            </div>

            <div className="bg-card/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="font-semibold text-primary-foreground mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center text-primary-foreground/90">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span>{mockGroup.schedule}</span>
                </div>
                <div className="flex items-center text-primary-foreground/90">
                  <MapPin className="w-5 h-5 mr-3" />
                  <span>{mockGroup.location}</span>
                </div>
                <div className="flex items-center text-primary-foreground/90">
                  <Users className="w-5 h-5 mr-3" />
                  <span>{mockGroup.members} / {mockGroup.maxMembers} members</span>
                </div>
                <div className="flex items-center text-primary-foreground/90">
                  <Clock className="w-5 h-5 mr-3" />
                  <span>Started {mockGroup.startDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">About This Group</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {mockGroup.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">What We Offer</h3>
                  <ul className="space-y-3">
                    {mockGroup.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center text-muted-foreground">
                        <CheckCircle className="w-5 h-5 text-group-status-active mr-3" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Requirements</h3>
                  <ul className="space-y-3">
                    {mockGroup.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center text-muted-foreground">
                        <CheckCircle className="w-5 h-5 text-primary mr-3" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
              <div className="space-y-6">
                {mockGroup.recentEvents.map((event, index) => (
                  <div key={index} className="border-l-4 border-primary pl-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <span className="text-sm text-muted-foreground">{event.date}</span>
                    </div>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Details */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Meeting Details</h2>
              <div className="bg-muted rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Next Meeting</h3>
                    <p className="text-muted-foreground">{mockGroup.nextMeeting}</p>
                    <p className="text-muted-foreground">{mockGroup.schedule}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Location</h3>
                    <p className="text-muted-foreground">{mockGroup.location}</p>
                    <p className="text-muted-foreground">{mockGroup.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Card */}
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6">
              {hasJoined ? (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-group-status-active mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">You're In!</h3>
                  <p className="text-muted-foreground mb-6">
                    Welcome to {mockGroup.name}. You'll receive meeting reminders and updates.
                  </p>
                  <div className="space-y-3">
                    <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium">
                      View Member Portal
                    </button>
                    <button className="w-full bg-muted text-foreground py-3 rounded-xl hover:bg-muted/80 transition-colors font-medium">
                      Contact Leader
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Users className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Join This Group</h3>
                  <p className="text-muted-foreground mb-6">
                    {mockGroup.members} of {mockGroup.maxMembers} spots filled
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-6">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(mockGroup.members / mockGroup.maxMembers) * 100}%` }}
                    ></div>
                  </div>

                  {mockGroup.isAcceptingMembers ? (
                    <button
                      onClick={handleJoinGroup}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary-hover transition-colors font-semibold flex items-center justify-center"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Join Group
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-group-status-full font-medium mb-4">This group is currently full</p>
                      <button className="w-full bg-muted text-foreground py-4 rounded-xl hover:bg-muted/80 transition-colors font-medium">
                        Join Waitlist
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-border">
                <button className="flex-1 flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button className="flex-1 flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>

            {/* Leader Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Group Leader</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  {mockGroup.leader.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{mockGroup.leader.name}</div>
                  <div className="text-sm text-muted-foreground">Group Leader</div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{mockGroup.leader.bio}</p>
              <div className="space-y-2">
                <a
                  href={`mailto:${mockGroup.leader.email}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {mockGroup.leader.email}
                </a>
                <a
                  href={`tel:${mockGroup.leader.phone}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {mockGroup.leader.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-foreground mb-4">Join {mockGroup.name}?</h3>
            <p className="text-muted-foreground mb-6">
              You're about to join this group. The group leader will be notified and you'll receive meeting updates and reminders.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmJoin}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium"
              >
                Yes, Join Group
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-muted text-foreground py-3 rounded-xl hover:bg-muted/80 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
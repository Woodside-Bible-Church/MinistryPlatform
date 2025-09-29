import Link from "next/link";
import { Calendar, MapPin, Clock, Users, ArrowRight, Plus } from "lucide-react";

const upcomingEvents = [
  {
    id: 1,
    title: "Young Adults Fall Retreat",
    description: "Join us for a weekend of worship, fellowship, and spiritual growth at Pine Lake Retreat Center.",
    date: "November 10-12, 2023",
    time: "Friday 6:00 PM - Sunday 3:00 PM",
    location: "Pine Lake Retreat Center",
    groupName: "Young Adults Bible Study",
    attendees: 18,
    maxAttendees: 25,
    image: "/api/placeholder/400/200",
    category: "retreat"
  },
  {
    id: 2,
    title: "Community Thanksgiving Dinner",
    description: "Come together as one church family to celebrate and give thanks. All groups invited!",
    date: "November 23, 2023",
    time: "5:00 PM - 8:00 PM",
    location: "Main Fellowship Hall",
    groupName: "All Groups",
    attendees: 120,
    maxAttendees: 150,
    image: "/api/placeholder/400/200",
    category: "fellowship"
  },
  {
    id: 3,
    title: "Women's Life Group Holiday Social",
    description: "An evening of fellowship, holiday treats, and gift exchange for the women in our community.",
    date: "December 8, 2023",
    time: "7:00 PM - 9:00 PM",
    location: "Room 205",
    groupName: "Women's Life Group",
    attendees: 8,
    maxAttendees: 15,
    image: "/api/placeholder/400/200",
    category: "social"
  },
  {
    id: 4,
    title: "Men's Prayer Breakfast Special Speaker",
    description: "Join us for a special breakfast with guest speaker Pastor Mike from Hope Community Church.",
    date: "December 4, 2023",
    time: "6:30 AM - 8:30 AM",
    location: "Main Sanctuary",
    groupName: "Men's Prayer Breakfast",
    attendees: 22,
    maxAttendees: 30,
    image: "/api/placeholder/400/200",
    category: "teaching"
  }
];

const eventCategories = [
  { name: "All Events", count: upcomingEvents.length, color: "bg-primary" },
  { name: "Retreats", count: 1, color: "bg-church-accent" },
  { name: "Fellowship", count: 1, color: "bg-church-secondary" },
  { name: "Social", count: 1, color: "bg-church-warm" },
  { name: "Teaching", count: 1, color: "bg-primary" }
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-hover to-accent text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Upcoming Events</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join us for special gatherings, retreats, and community events throughout the year.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {eventCategories.map((category, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`w-8 h-8 ${category.color} text-white rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">{category.count}</div>
              <div className="text-sm text-muted-foreground">{category.name}</div>
            </div>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-group-card-bg border border-group-card-border rounded-2xl overflow-hidden hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              {/* Event Image */}
              <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-card text-card-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground line-clamp-2">{event.title}</h3>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event.attendees} / {event.maxAttendees} registered</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Hosted by <span className="font-medium text-foreground">{event.groupName}</span>
                  </div>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors font-medium">
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Want to host an event?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Group leaders can create and manage events for their communities. Get in touch with our events team to learn more about hosting your own gathering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </button>
            <Link
              href="/groups"
              className="inline-flex items-center px-8 py-4 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors"
            >
              Browse Groups
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Event Guidelines</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>All events must be approved by group leaders</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Registration may be required for capacity planning</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Events are open to all church members unless specified</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Check with your group leader for special arrangements</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Have questions about an event or need assistance with registration? Our events team is here to help.
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-foreground">Email:</span>
                <span className="text-muted-foreground ml-2">events@church.com</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground">Phone:</span>
                <span className="text-muted-foreground ml-2">(555) 123-4567</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground">Office Hours:</span>
                <span className="text-muted-foreground ml-2">Mon-Fri, 9:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
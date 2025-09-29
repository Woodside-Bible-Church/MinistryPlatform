import Link from "next/link";
import { ArrowRight, Users, Calendar, MapPin, Heart, Star, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-hover to-accent text-primary-foreground">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Find Your <span className="text-church-secondary">Community</span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
              Join a small group, bible study, or community gathering. Connect with others who share your faith and grow together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/groups"
                className="inline-flex items-center px-8 py-4 bg-church-secondary text-church-secondary-foreground rounded-xl font-semibold hover:bg-secondary-hover transition-colors shadow-lg"
              >
                Browse Groups
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/groups/create"
                className="inline-flex items-center px-8 py-4 bg-card text-card-foreground rounded-xl font-semibold hover:bg-muted transition-colors border border-white/20"
              >
                Start a Group
                <Users className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">25+</div>
              <div className="text-lg font-medium text-foreground mb-1">Active Groups</div>
              <div className="text-muted-foreground">Bible studies, life groups, and ministries</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-lg font-medium text-foreground mb-1">Members</div>
              <div className="text-muted-foreground">Connected and growing together</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-lg font-medium text-foreground mb-1">Meeting Times</div>
              <div className="text-muted-foreground">Throughout the week</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Groups */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Featured Groups
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover popular groups in our community that are actively welcoming new members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Group Card 1 */}
            <div className="group bg-group-card-bg border border-group-card-border rounded-2xl p-6 hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-group-category-bg text-accent-foreground rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1 bg-group-status-active/10 text-group-status-active px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-group-status-active rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Young Adults Bible Study</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                Join us for deeper study of God's word, fellowship, and prayer. Perfect for ages 18-30.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Thursdays, 7:00 PM</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Fellowship Hall</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>12 members</span>
                </div>
              </div>
              <Link
                href="/groups/young-adults"
                className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium"
              >
                Learn More
              </Link>
            </div>

            {/* Group Card 2 */}
            <div className="group bg-group-card-bg border border-group-card-border rounded-2xl p-6 hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-church-secondary text-secondary-foreground rounded-xl">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1 bg-group-status-active/10 text-group-status-active px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-group-status-active rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Women's Life Group</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                A supportive community for women to grow in faith, share life experiences, and build lasting friendships.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Tuesdays, 10:00 AM</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Room 205</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>8 members</span>
                </div>
              </div>
              <Link
                href="/groups/womens-life"
                className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium"
              >
                Learn More
              </Link>
            </div>

            {/* Group Card 3 */}
            <div className="group bg-group-card-bg border border-group-card-border rounded-2xl p-6 hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-church-warm text-secondary-foreground rounded-xl">
                  <Star className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1 bg-group-status-active/10 text-group-status-active px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-group-status-active rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Family Ministry</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                Activities and fellowship for families with children. Building strong family foundations through faith.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Sundays, 11:30 AM</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Children's Wing</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>15 families</span>
                </div>
              </div>
              <Link
                href="/groups/family-ministry"
                className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary-hover transition-colors font-medium"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/groups"
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-colors"
            >
              View All Groups
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Find Your Perfect Fit
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore different types of groups and find the community that's right for you.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              href="/groups?category=bible-study"
              className="group p-6 bg-card border border-border rounded-2xl text-center hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Bible Study</h3>
              <p className="text-sm text-muted-foreground">Deep study and discussion</p>
            </Link>

            <Link
              href="/groups?category=life-groups"
              className="group p-6 bg-card border border-border rounded-2xl text-center hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-church-secondary text-secondary-foreground rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Life Groups</h3>
              <p className="text-sm text-muted-foreground">Support and fellowship</p>
            </Link>

            <Link
              href="/groups?category=ministry"
              className="group p-6 bg-card border border-border rounded-2xl text-center hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-church-accent text-accent-foreground rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Ministry</h3>
              <p className="text-sm text-muted-foreground">Serve together</p>
            </Link>

            <Link
              href="/groups?category=special-interest"
              className="group p-6 bg-card border border-border rounded-2xl text-center hover:bg-group-card-hover hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-church-warm text-secondary-foreground rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Special Interest</h3>
              <p className="text-sm text-muted-foreground">Shared hobbies & interests</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary via-primary-hover to-accent p-8 sm:p-12 rounded-3xl text-primary-foreground">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Connect?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Don't wait to find your community. Join a group today or start one of your own and begin building meaningful relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/groups"
                className="inline-flex items-center px-8 py-4 bg-card text-card-foreground rounded-xl font-semibold hover:bg-muted transition-colors"
              >
                Join a Group
                <Users className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/groups/create"
                className="inline-flex items-center px-8 py-4 bg-church-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary-hover transition-colors"
              >
                Start a Group
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

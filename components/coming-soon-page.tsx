"use client";

import { SimpleButton } from "@/components/ui/simple-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail, Users, Settings } from "lucide-react";
import { useState } from "react";
import { ThemeSwitch } from "@/components/ui/theme-toggle";

export function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the email to your backend
    setIsSubscribed(true);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch />
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6">
            <span className="text-3xl font-bold text-primary-foreground">
              K
            </span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Knesty
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Sunday School Management System
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Coming Soon
          </Badge>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-12">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">
                Revolutionizing Sunday School Management
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                We're building the most comprehensive and user-friendly platform
                to help you manage your Sunday School operations with ease and
                efficiency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Features Preview */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Student Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive student profiles and tracking
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Activity Planning</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule and manage all your activities
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Church Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Multi-church support and administration
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Communication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stay connected with families and staff
                  </p>
                </div>
              </div>

              {/* Email Subscription */}
              <div className="max-w-md mx-auto">
                {!isSubscribed ? (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Get notified when we launch
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="flex-1"
                        />
                        <SimpleButton type="submit">Notify Me</SimpleButton>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      Thank you! We'll notify you when Knesty is ready.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Development Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Core Features Development</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      In Progress
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Beta Testing</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Q1 2025
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Public Launch</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Q2 2025
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you an administrator with access?
          </p>
          <SimpleButton
            variant="outline"
            onClick={() => (window.location.href = "/admin")}
          >
            Access Admin Panel
          </SimpleButton>
        </div>
      </div>
    </div>
  );
}

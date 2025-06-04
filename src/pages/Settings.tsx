import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const SettingsPage = () => {
  const { logout, user, updateUserInfo } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState(
    user?.frontend_settings?.notificationSettings || {
      emailNotifications: true,
      workoutReminders: true,
      achievementAlerts: true,
      weeklyReports: false,
    },
  );

  const [displaySettings, setDisplaySettings] = useState(
    user?.frontend_settings?.displaySettings || {
      theme,
      showMetricUnits: true,
    },
  );

  const handleNotificationChange = (
    setting: keyof typeof notificationSettings,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleDisplayChange = (
    setting: keyof typeof displaySettings,
    value: "system" | "light" | "dark",
  ) => {
    if (setting === "theme") {
      setTheme(value);
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    const updatedSettings = {
      notificationSettings,
      displaySettings,
    };

    api
      .updateUserInfo({ frontend_settings: updatedSettings })
      .then((data) => {
        updateUserInfo(data);
        toast.success("Settings saved successfully");
      })
      .catch(() => {
        toast.error("Failed to save settings");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (confirm) {
      toast.error("Account deletion is not implemented in this demo");
    }
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-fitness-600 to-fitness-700 bg-clip-text text-transparent">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="fitness-card border border-fitness-200/50">
          <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fitness-600 data-[state=active]:to-fitness-700 data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fitness-600 data-[state=active]:to-fitness-700 data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fitness-600 data-[state=active]:to-fitness-700 data-[state=active]:text-white">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card className="fitness-card border-2 border-fitness-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-fitness-700 dark:text-fitness-400">Display Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-muted-foreground text-sm">
                    Choose between system, light, or dark theme
                  </p>
                </div>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) =>
                    handleDisplayChange(
                      "theme",
                      e.target.value as "system" | "light" | "dark",
                    )
                  }
                  className="border rounded px-2 py-1 bg-background text-foreground"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="metric-units">Use Metric Units</Label>
                  <p className="text-muted-foreground text-sm">
                    Display weights in kg and heights in cm
                  </p>
                </div>
                <Switch
                  id="metric-units"
                  checked={displaySettings.showMetricUnits}
                  onCheckedChange={() => handleDisplayChange("showMetricUnits")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card className="fitness-card border-2 border-fitness-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-fitness-700 dark:text-fitness-400">Notification Settings</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() =>
                    handleNotificationChange("emailNotifications")
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="workout-reminders">Workout Reminders</Label>
                  <p className="text-muted-foreground text-sm">
                    Get reminded about scheduled workouts
                  </p>
                </div>
                <Switch
                  id="workout-reminders"
                  checked={notificationSettings.workoutReminders}
                  onCheckedChange={() =>
                    handleNotificationChange("workoutReminders")
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                  <p className="text-muted-foreground text-sm">
                    Be notified when you reach fitness milestones
                  </p>
                </div>
                <Switch
                  id="achievement-alerts"
                  checked={notificationSettings.achievementAlerts}
                  onCheckedChange={() =>
                    handleNotificationChange("achievementAlerts")
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-reports">Weekly Reports</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive weekly summaries of your progress
                  </p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={() =>
                    handleNotificationChange("weeklyReports")
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 pt-4">
          <Card className="fitness-card border-2 border-fitness-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-fitness-700 dark:text-fitness-400">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>

              <Button variant="fitness">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="fitness-card border-2 border-fitness-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-fitness-700 dark:text-fitness-400">Account Actions</CardTitle>
              <CardDescription>Manage your account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Log out from all devices</h3>
                <p className="text-muted-foreground text-sm">
                  This will log you out from all devices where you're currently
                  logged in
                </p>
                <Button variant="outline" onClick={logout} className="border-2 border-fitness-600 text-fitness-600 hover:bg-fitness-600 hover:text-white transition-all duration-200">
                  Log out from all devices
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

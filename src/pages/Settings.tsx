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
import { toast } from "sonner";

const SettingsPage = () => {
  const { logout, user, updateUserInfo } = useAuth();
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
      darkMode: false,
      compactView: false,
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

  const handleDisplayChange = (setting: keyof typeof displaySettings) => {
    setDisplaySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-muted-foreground text-sm">
                    Enable dark mode for the application
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={displaySettings.darkMode}
                  onCheckedChange={() => handleDisplayChange("darkMode")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-muted-foreground text-sm">
                    Show more content with less spacing
                  </p>
                </div>
                <Switch
                  id="compact-view"
                  checked={displaySettings.compactView}
                  onCheckedChange={() => handleDisplayChange("compactView")}
                />
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

          <div className="flex justify-end">
            <Button
              className="bg-fitness-600 hover:bg-fitness-700"
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
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

          <div className="flex justify-end">
            <Button
              className="bg-fitness-600 hover:bg-fitness-700"
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
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

              <Button className="bg-fitness-600 hover:bg-fitness-700">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Log out from all devices</h3>
                <p className="text-muted-foreground text-sm">
                  This will log you out from all devices where you're currently
                  logged in
                </p>
                <Button variant="outline" onClick={logout}>
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

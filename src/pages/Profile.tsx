
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar, Weight, Ruler, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserInfo } from "@/types/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const ProfilePage = () => {
  const { user, updateUserInfo } = useAuth();
  const [formData, setFormData] = useState<Partial<UserInfo>>({
    bio: "",
    age: null,
    height: null,
    weight: null,
    gender: null,
    fitness_level: null,
    fitness_goal: null
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || "",
        age: user.age,
        height: user.height,
        weight: user.weight,
        gender: user.gender,
        fitness_level: user.fitness_level,
        fitness_goal: user.fitness_goal
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      // Height in meters (height is in cm)
      const heightInMeters = formData.height / 100;
      return (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const updatedData = { ...formData };
    
    // Calculate BMI
    if (formData.weight && formData.height) {
      const bmi = calculateBMI();
      if (bmi) {
        updatedData.bmi = parseFloat(bmi);
      }
    }
    
    try {
      await updateUserInfo(updatedData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and fitness details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">{user?.fullname || user?.username}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            
            <div className="w-full mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-fitness-600" />
                  <span>Fitness Level</span>
                </div>
                <span className="font-medium capitalize">{user?.fitness_level || "Not set"}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-fitness-600" />
                  <span>Age</span>
                </div>
                <span className="font-medium">{user?.age || "Not set"}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2 text-fitness-600" />
                  <span>Height</span>
                </div>
                <span className="font-medium">{user?.height ? `${user.height} cm` : "Not set"}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Weight className="h-5 w-5 mr-2 text-fitness-600" />
                  <span>Weight</span>
                </div>
                <span className="font-medium">{user?.weight ? `${user.weight} kg` : "Not set"}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5 mr-2 text-fitness-600"
                  >
                    <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z"></path>
                    <path d="m3.09 8.84 12.35-6.61a1.93 1.93 0 0 1 1.81 0l3.65 1.9a2.12 2.12 0 0 1 .1 3.69L8.73 14.75a2 2 0 0 1-1.94 0L3 12.51a2.12 2.12 0 0 1 .09-3.67Z"></path>
                    <line x1="12" y1="22" x2="12" y2="13"></line>
                  </svg>
                  <span>BMI</span>
                </div>
                <span className="font-medium">{user?.bmi || "Not calculated"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your fitness profile and personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="fitness">Fitness Details</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit}>
                <TabsContent value="personal" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      className="min-h-[120px]"
                      value={formData.bio || ""}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min={13}
                        max={100}
                        placeholder="Your age"
                        value={formData.age || ""}
                        onChange={(e) => handleInputChange("age", e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={formData.gender || ""} 
                        onValueChange={(value) => handleInputChange("gender", value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={100}
                        max={220}
                        placeholder="Your height"
                        value={formData.height || ""}
                        onChange={(e) => handleInputChange("height", e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={30}
                        max={200}
                        step="0.1"
                        placeholder="Your weight"
                        value={formData.weight || ""}
                        onChange={(e) => handleInputChange("weight", e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="fitness" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fitness_level">Fitness Level</Label>
                    <Select 
                      value={formData.fitness_level || ""} 
                      onValueChange={(value) => handleInputChange("fitness_level", value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fitness_goal">Fitness Goal</Label>
                    <Select 
                      value={formData.fitness_goal || ""} 
                      onValueChange={(value) => handleInputChange("fitness_goal", value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fitness goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="lose weight">Lose Weight</SelectItem>
                        <SelectItem value="gain weight">Gain Weight</SelectItem>
                        <SelectItem value="maintain weight">Maintain Weight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>BMI (Calculated)</Label>
                    <div className="p-3 bg-muted rounded-md">
                      {calculateBMI() || "Fill in your height and weight to calculate BMI"}
                    </div>
                  </div>
                </TabsContent>
                
                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    className="bg-fitness-600 hover:bg-fitness-700"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;

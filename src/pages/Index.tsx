
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dumbbell, BarChart, MessageCircle, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-fitness-500">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">FitTrack AI</h1>
          </div>
          <div className="hidden md:flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button className="bg-fitness-600 hover:bg-fitness-700" asChild>
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-fitness-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Your AI-Powered <span className="text-fitness-600">Fitness Journey</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Track workouts, create custom plans, and get personalized AI coaching to help you reach your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-fitness-600 hover:bg-fitness-700" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Succeed</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-fitness-100 mb-4">
                <Dumbbell className="h-8 w-8 text-fitness-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Workout Library</h3>
              <p className="text-muted-foreground">
                Access a comprehensive database of exercises and pre-built workout routines
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-fitness-100 mb-4">
                <Calendar className="h-8 w-8 text-fitness-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Record your workouts and track your improvements with detailed analytics
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-fitness-100 mb-4">
                <BarChart className="h-8 w-8 text-fitness-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Training Plans</h3>
              <p className="text-muted-foreground">
                Follow structured workout plans tailored to your goals and fitness level
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-fitness-100 mb-4">
                <MessageCircle className="h-8 w-8 text-fitness-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Coach</h3>
              <p className="text-muted-foreground">
                Get personalized advice and motivation from your intelligent fitness assistant
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-fitness-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your fitness journey?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already improved their health and fitness with FitTrack AI.
          </p>
          <Button size="lg" className="bg-white text-fitness-800 hover:bg-gray-100" asChild>
            <Link to="/register">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="p-2 rounded-full bg-fitness-500">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">FitTrack AI</span>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-fitness-600">About</a>
              <a href="#" className="text-muted-foreground hover:text-fitness-600">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-fitness-600">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-fitness-600">Contact</a>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FitTrack AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

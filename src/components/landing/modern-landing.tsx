"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Star, 
  Users, 
  Zap, 
  Shield, 
  BarChart3,
  Database,
  Brain,
  Code,
  Globe,
  Cloud,
  Cpu,
  Layers,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  Rocket,
  Sparkles,
  ChevronDown,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"

export function ModernLanding({ onGetStarted }: { onGetStarted?: () => void }) {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("features")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    }
  }

  const handleBrowseModels = () => {
    router.push('/models')
  }

  const handleUploadDataset = () => {
    router.push('/datasets')
  }

  const handleViewPricing = () => {
    router.push('/billing')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  const features = [
    {
      icon: Brain,
      title: "Advanced AI Models",
      description: "Access cutting-edge models including GPT-4, LLaMA-3, Claude, and more",
      benefits: ["State-of-the-art architectures", "Pre-trained on diverse data", "Optimized for specific tasks"]
    },
    {
      icon: Zap,
      title: "One-Click Training",
      description: "Fine-tune models without ML expertise or complex setup",
      benefits: ["Automated hyperparameter tuning", "Real-time progress tracking", "Intelligent resource allocation"]
    },
    {
      icon: Rocket,
      title: "Instant Deployment",
      description: "Deploy models as scalable APIs with comprehensive monitoring",
      benefits: ["Auto-scaling infrastructure", "Global CDN distribution", "Built-in load balancing"]
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor training progress and model performance with detailed metrics",
      benefits: ["Live performance dashboards", "Custom metrics tracking", "Advanced visualization tools"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption and compliance",
      benefits: ["AES-256 encryption", "SOC 2 compliance", "Regular security audits"]
    },
    {
      icon: Database,
      title: "Smart Data Management",
      description: "Intelligent dataset processing and validation",
      benefits: ["Automated data cleaning", "Format validation", "Quality assessment"]
    }
  ]

  const useCases = [
    {
      title: "Customer Support",
      description: "Train AI assistants on your support tickets and documentation",
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Content Creation",
      description: "Fine-tune models for your brand voice and content style",
      icon: Code,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Data Analysis",
      description: "Create specialized models for your specific data analysis needs",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Code Generation",
      description: "Train models on your codebase for intelligent code completion",
      icon: Cpu,
      color: "from-orange-500 to-red-500"
    }
  ]

  const stats = [
    { label: "Active Users", value: "10,000+", icon: Users },
    { label: "Models Trained", value: "50,000+", icon: Brain },
    { label: "API Calls", value: "1B+", icon: Zap },
    { label: "Uptime", value: "99.9%", icon: Shield }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechCorp",
      content: "FTaaS reduced our model training time from months to days. The platform is incredibly intuitive.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "ML Engineer at DataFlow",
      content: "The one-click deployment feature is a game-changer. We've deployed 20+ models without any DevOps overhead.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Product Manager at AI Solutions",
      content: "Finally, a platform that makes AI accessible to our entire team, not just data scientists.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm" : "bg-transparent"
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FTaaS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {["features", "use-cases", "pricing", "about"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors capitalize"
                >
                  {item.replace("-", " ")}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleViewPricing}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </Button>
              <Button 
                onClick={() => {
                  if (onGetStarted) {
                    onGetStarted()
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-2">
                {["features", "use-cases", "pricing", "about"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="text-gray-600 hover:text-gray-900 font-medium py-2 text-left capitalize"
                  >
                    {item.replace("-", " ")}
                  </button>
                ))}
                <Button 
                  onClick={() => {
                    if (onGetStarted) {
                      onGetStarted()
                    }
                  }}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium text-sm">Enterprise AI Fine-Tuning Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Data into
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Intelligent AI Models
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Fine-tune cutting-edge AI models with your data. No machine learning expertise required. 
              Deploy in minutes, not months.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-2xl font-medium shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleBrowseModels}
                className="text-lg px-8 py-4 rounded-2xl font-medium border-2 border-gray-300 hover:border-gray-400"
              >
                <Brain className="mr-2 h-5 w-5" />
                Browse Models
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {["No credit card required", "14-day free trial", "Enterprise security", "24/7 support"].map((item) => (
                <div key={item} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="space-y-2">
                  <stat.icon className="w-8 h-8 mx-auto text-blue-600" />
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Demo Card */}
          <Card className="p-8 border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Live Training Demo</h3>
                <Badge className="bg-green-100 text-green-700">Live</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Training Progress</span>
                  <span className="text-blue-600 font-medium">87% Complete</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000" style={{ width: '87%' }}></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    { label: "Data Upload", status: "Complete", color: "text-green-600" },
                    { label: "Model Selection", status: "Complete", color: "text-green-600" },
                    { label: "Training", status: "In Progress", color: "text-blue-600" },
                    { label: "Deployment", status: "Pending", color: "text-gray-400" }
                  ].map((step, index) => (
                    <div key={index} className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-gray-900">{step.label}</div>
                      <div className={step.color}>{step.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make AI fine-tuning accessible and efficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how FTaaS can transform your business with specialized AI models
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="space-y-4 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center shadow-md">
                    <useCase.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{useCase.title}</h3>
                  <p className="text-gray-600 text-sm">{useCase.description}</p>
                  <Button onClick={handleGetStarted} variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                    Get Started <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of companies transforming their business with FTaaS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg">
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 border-0 shadow-lg">
              <CardContent className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Free</h3>
                <div className="text-4xl font-bold text-gray-900">$0<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600">Perfect for getting started</p>
                <ul className="space-y-3">
                  {["1 model training", "1GB storage", "Community support", "Basic analytics"].map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">Get Started</Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-0 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Most Popular</Badge>
              </div>
              <CardContent className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                <div className="text-4xl font-bold text-gray-900">$99<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600">For growing businesses</p>
                <ul className="space-y-3">
                  {["10 model trainings", "10GB storage", "Priority support", "Advanced analytics", "API access", "Custom models"].map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Start Free Trial</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 border-0 shadow-lg">
              <CardContent className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900">Custom</div>
                <p className="text-gray-600">For large organizations</p>
                <ul className="space-y-3">
                  {["Unlimited models", "Unlimited storage", "24/7 dedicated support", "Custom integrations", "SLA guarantee", "White-label options"].map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business with AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies using FTaaS to build intelligent AI models
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => {
                if (onGetStarted) {
                  onGetStarted()
                }
              }}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-2xl font-medium"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => scrollToSection("pricing")}
              className="text-lg px-8 py-4 rounded-2xl font-medium border-white text-white hover:bg-white hover:text-blue-600"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">FTaaS</span>
              </div>
              <p className="text-gray-400">
                Fine-Tuning as a Service platform for businesses of all sizes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-gray-400">
                {["Features", "Pricing", "Use Cases", "Documentation"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-gray-400">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-gray-400">
                {["Help Center", "Community", "Status", "API"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FTaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
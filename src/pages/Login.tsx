import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle, Github, Chrome, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioEffects } from "@/hooks/use-audio-effects";
import ParticleBackground from "@/components/ui/ParticleBackground";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { playSound } = useAudioEffects();
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Redirect if already logged in — check onboarding status
  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();
      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };
    checkOnboarding();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        // onAuthStateChange will update user → useEffect redirects
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        toast.success("Account created! Check your email to verify, or sign in now.");
        setLoading(false);
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen w-full flex animated-bg text-foreground relative overflow-hidden">
      
      {/* Interactive Neural Particle Field */}
      <ParticleBackground />

      {/* Glassmorphism Navbar */}
      <nav className="absolute top-0 left-0 w-full h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl z-50 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[#8ba3c7] text-xs font-medium hidden sm:inline-block">
            {isLogin ? "New to the platform?" : "Welcome back, agent."}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="px-5 py-2 glass rounded-full text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all duration-300 text-xs font-bold uppercase tracking-widest border border-cyan-400/20"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Left side: Sentinel System Mockup (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10 w-full max-w-2xl"
           onMouseMove={handleMouseMove}
           onMouseLeave={handleMouseLeave}
      >
        <motion.div 
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="w-full max-w-lg glass rounded-3xl p-8 shadow-2xl overflow-hidden relative"
          initial={{ opacity: 0, x: -40 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Energy Pulse Border for Left Card */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
            <motion.div 
              className="absolute w-[40%] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
              animate={{
                left: ["-100%", "150%"],
                top: ["100%", "100%", "0%", "0%", "100%"],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Typography-focused Hero Card */}
          <div className="flex flex-col gap-10 relative z-10 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-400 uppercase">Identity Protection</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-zinc-100 leading-[1.1] tracking-tighter">
                SECURE YOUR <br />
                <span className="text-zinc-500">AI PRESENCE.</span>
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-sm font-medium">
                Advanced citation auditing and visibility tracking for the next generation of generative search.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { title: "UNIFIED VISIBILITY", desc: "Monitor your brand across ChatGPT, Claude, and Gemini in real-time." },
                { title: "CITATION AUDITING", desc: "Automatic detection and verification of brand mentions in AI responses." },
                { title: "SENTIMENT ANALYSIS", desc: "Deep-learning insights into how AI portrays your brand identity." }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title} 
                  className="flex gap-4 group cursor-default"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                >
                  <div className="h-6 w-6 rounded-full border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                    0{i + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold tracking-widest text-zinc-200 uppercase group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-zinc-950 bg-zinc-900 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase">Trusted by 50+ Global Teams</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 z-20">
        <motion.div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="w-full max-w-[420px] glass rounded-[28px] p-8 sm:p-10 shadow-2xl relative"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Energy Pulse Border (Traveling Light) */}
          <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none z-0">
            <motion.div 
              className="absolute w-[40%] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
              animate={{
                left: ["-100%", "150%"],
                top: ["0%", "0%", "100%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div 
              className="absolute w-[1.5px] h-[40%] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-80"
              animate={{
                top: ["-100%", "150%"],
                right: ["0%", "0%", "100%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
                delay: 2.5,
              }}
            />
          </div>

          <div className="mb-8 relative z-10" onMouseEnter={() => playSound('hover')}>
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold tracking-widest text-[10px] uppercase">
              {isLogin ? "Welcome Back" : "Onboarding"}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
              {isLogin ? "Sign in to Sentinel" : "Create your account securely"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] font-bold tracking-widest text-[#8ba3c7] uppercase">Full Name</Label>
                <Input 
                  id="name" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  placeholder="Enter your name" 
                  className="bg-[#0f141f] border border-cyan-400/10 text-white h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:ring-offset-0 px-4 placeholder:text-[#4b6a9c]" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold tracking-widest text-[#8ba3c7] uppercase">{isLogin ? "Email Address" : "Work Email"}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@company.com" 
                className="bg-[#0f141f] border border-cyan-400/10 text-white h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:ring-offset-0 px-4 placeholder:text-[#4b6a9c]" 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-bold tracking-widest text-[#8ba3c7] uppercase">Password</Label>
                {isLogin && <button type="button" className="text-[11px] text-cyan-400 hover:text-white transition-colors">Forgot?</button>}
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="bg-[#0f141f] border border-cyan-400/10 text-white h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:ring-offset-0 px-4 placeholder:text-[#4b6a9c]" 
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-4 rounded-xl font-bold text-[15px] bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0 text-white active:scale-95" 
              disabled={loading}
              onClick={() => playSound('click')}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Continue"}
            </Button>
          </form>

          

          <div className="mt-8 pt-8 border-t border-cyan-400/10 relative z-10">
            <div className="text-center text-[10px] font-bold tracking-widest text-[#8ba3c7] uppercase mb-4">
              Or {isLogin ? 'Sign In' : 'Sign Up'} With
            </div>
            <div className="flex items-center justify-center gap-4">
              <button 
                type="button" 
                onClick={handleGoogle}
                className="h-12 w-12 rounded-full bg-[#0f141f] border border-cyan-400/10 flex items-center justify-center hover:bg-cyan-500/10 transition-colors"
              >
                <Chrome className="h-5 w-5 text-cyan-400" />
              </button>
              <button 
                type="button" 
                disabled
                className="h-12 w-12 rounded-full bg-[#0f141f] border border-cyan-400/10 flex items-center justify-center hover:bg-cyan-500/10 transition-colors opacity-50 cursor-not-allowed"
              >
                <Github className="h-5 w-5 text-cyan-400" />
              </button>
            </div>
            
            {!isLogin && (
              <p className="text-center text-[11px] text-[#8ba3c7] mt-6">
                By signing up, you agree to our <a href="#" className="text-cyan-400 hover:text-white underline underline-offset-2 transition-colors">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

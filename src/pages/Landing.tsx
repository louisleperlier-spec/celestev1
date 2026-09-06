import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import EmotionMapSection from "../components/landing/EmotionMapSection";
import Features from "../components/landing/Features";
import ResourcesPreview from "../components/landing/ResourcesPreview";
import Testimonials from "../components/landing/Testimonials";
import Pricing from "../components/landing/Pricing";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="grain min-h-screen bg-void-900">
      <Navbar />
      <main>
        <Hero />
        <EmotionMapSection />
        <Features />
        <ResourcesPreview />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

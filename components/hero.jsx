"use client";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
  const imageRef = useRef();

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className=" pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl lg:text-[90px] pb-6 gradient-title">
          The future of personal finance-
          <br />
          powered by AI.
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-4xl mx-auto mt-2">
          Smarter choices begin with smarter tools. From daily expenses to
          long-term dreams, our AI empowers you to manage every rupee with
          clarity and confidence.
        </p>

        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="px-8">
              Watch Again
            </Button>
          </Link>
        </div>
        <div className="hero-image-wrapper flex justify-center mt-5 ">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.jpeg"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto "
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { useState, useEffect } from "react";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [bgImage, setBgImage] = useState("");

  useEffect(() => {
    const images = ["bg1.png", "bg2.png", "bg3.png"];
    const randomImg = images[Math.floor(Math.random() * images.length)];
    setBgImage(`/images/${randomImg}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dynamic Background Image */}
      {bgImage && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.04] transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(0.5)'
          }}
        />
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default Layout;

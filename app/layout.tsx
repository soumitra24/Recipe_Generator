// src/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // Import Poppins font object
import "./globals.css";

// Configure the font weights and subsets you need
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Add weights as needed
  variable: '--font-poppins', // Optional: CSS variable
});

export const metadata: Metadata = {
  title: "Recipe Generator",
  description: "Generate recipes from ingredients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font class to the body */}
      <body className={`${poppins.className} bg-white`}>
        {children}
      </body>
    </html>
  );
}
import React from "react";

export default function Header() {
  return (
    <header className="flex items-center justify-center py-4 bg-white shadow">
      <img
        src="/mono.png"
        alt="n-dizi Logo"
        className="h-10 w-10 object-contain mr-2"
      />
      <h1 className="text-xl font-bold text-gray-800">n-dizi Store Manager</h1>
    </header>
  );
}

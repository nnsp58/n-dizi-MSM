import React, { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Login submitted");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <img
          src="/mono.png"
          alt="n-dizi.in"
          className="w-20 h-20 mx-auto mb-3 object-contain"
        />
        <h1 className="text-2xl font-bold mb-1 text-gray-800">Welcome Back</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
          >
            Sign In
          </button>
        </form>
        <div className="flex justify-between text-sm mt-4">
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot Password?
          </a>
          <a href="/reset-password" className="text-blue-600 hover:underline">
            Reset Password
          </a>
        </div>
        <p className="mt-4 text-sm">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

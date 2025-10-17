import React, { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        alert(isLogin ? "✅ Login successful!" : "✅ Signup successful!");
        localStorage.setItem("token", data.token || "");
      } else {
        alert(data.message || "Failed. Try again.");
      }
    } catch (err) {
      alert("Server unreachable. Try again later.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <img
          src="/mono.png"
          alt="n-dizi.in"
          className="w-20 h-20 mx-auto mb-3 object-contain"
        />
        <h1 className="text-2xl font-bold mb-1 text-gray-800">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {isLogin ? "Sign in to your account" : "Register a new account"}
        </p>
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
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <div className="flex justify-between text-sm mt-4">
          <a href="#" className="text-blue-600 hover:underline">
            Forgot Password?
          </a>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Need an account?" : "Already have an account?"}
          </button>
        </div>
      </div>
    </div>
  );
}

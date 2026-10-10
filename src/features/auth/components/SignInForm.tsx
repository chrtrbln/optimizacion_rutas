"use client";

import { useState, type FormEvent } from "react";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("El acceso estará disponible cuando se conecte la autenticación.");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-sm font-medium text-[#263b33]"
          htmlFor="email"
        >
          Correo electrónico
        </label>
        <input
          autoComplete="username"
          className="h-12 w-full rounded-md border border-[#cfd8ce] bg-white px-3.5 text-sm text-[#1d302a] outline-none transition placeholder:text-[#89958e] focus:border-[#36715c] focus:ring-2 focus:ring-[#36715c]/15"
          id="email"
          name="email"
          placeholder="nombre@empresa.com"
          required
          type="email"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="block text-sm font-medium text-[#263b33]" htmlFor="password">
            Contraseña
          </label>
          <button
            aria-pressed={showPassword}
            className="text-sm font-medium text-[#356b57] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356b57]"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <input
          autoComplete="current-password"
          className="h-12 w-full rounded-md border border-[#cfd8ce] bg-white px-3.5 text-sm text-[#1d302a] outline-none transition placeholder:text-[#89958e] focus:border-[#36715c] focus:ring-2 focus:ring-[#36715c]/15"
          id="password"
          name="password"
          placeholder="Ingresa tu contraseña"
          required
          type={showPassword ? "text" : "password"}
        />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-[#52635a]">
        <input
          className="size-4 accent-[#356b57]"
          name="remember"
          type="checkbox"
        />
        Mantener sesión iniciada
      </label>

      <button
        className="flex h-12 w-full items-center justify-center rounded-md bg-[#d96f48] px-5 text-sm font-semibold text-white transition hover:bg-[#c45d39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45d39]"
        type="submit"
      >
        Iniciar sesión
      </button>

      <p aria-live="polite" className="min-h-5 text-sm text-[#8b4c32]">
        {message}
      </p>
    </form>
  );
}
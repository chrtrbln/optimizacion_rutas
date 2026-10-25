"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../supabase/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          setMessage("Confirma tu correo electrónico antes de iniciar sesión.");
        } else if (error.status === 429) {
          setMessage("Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.");
        } else {
          setMessage("No se pudo iniciar sesión. Verifica tu correo y contraseña.");
        }
        return;
      }

      if (!data.user) {
        setMessage("No se pudo validar tu sesión. Intenta de nuevo.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servicio de acceso. Intenta de nuevo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
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
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@empresa.com"
          required
          type="email"
          value={email}
          disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ingresa tu contraseña"
          required
          type={showPassword ? "text" : "password"}
          value={password}
          disabled={isSubmitting}
        />
      </div>

      <button
        className="flex h-12 w-full items-center justify-center rounded-md bg-[#d96f48] px-5 text-sm font-semibold text-white transition hover:bg-[#c45d39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45d39] disabled:cursor-wait disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Validando acceso..." : "Iniciar sesión"}
      </button>

      <p aria-live="polite" className="min-h-5 text-sm text-[#8b4c32]" role="status">
        {message}
      </p>
    </form>
  );
}
"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/forms";
import { button, input, label as labelClass } from "./styles";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: keyof typeof button;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={`${button[variant]} ${className}`}
      {...props}
    >
      {pending ? (pendingText ?? "جارٍ الإرسال…") : children}
    </button>
  );
}

/** Banner for a form-level error or success message. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message || state.status === "idle") return null;
  const isError = state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm ${
        isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {state.message}
    </p>
  );
}

type FieldProps = {
  name: string;
  label: string;
  state?: FormState;
  hint?: ReactNode;
  defaultValue?: string;
};

function FieldShell({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  state,
  hint,
  defaultValue,
  ...props
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  const error = state?.fieldErrors?.[name];
  return (
    <FieldShell name={name} label={label} error={error} hint={hint}>
      <input
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={input}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  state,
  hint,
  defaultValue,
  ...props
}: FieldProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue">) {
  const error = state?.fieldErrors?.[name];
  return (
    <FieldShell name={name} label={label} error={error} hint={hint}>
      <textarea
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={`${input} leading-relaxed`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  state,
  hint,
  defaultValue,
  options,
  placeholder,
  ...props
}: FieldProps & {
  options: readonly (readonly [string, string])[];
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "defaultValue">) {
  const error = state?.fieldErrors?.[name];
  return (
    <FieldShell name={name} label={label} error={error} hint={hint}>
      <select
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className={input}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

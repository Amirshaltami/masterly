export const PASSWORD_POLICY = {
  minLength: 10,
  maxLength: 64,
  rules: [
    "At least 10 characters",
    "At most 64 characters",
    "At least 1 uppercase letter",
    "At least 1 lowercase letter",
    "At least 1 number",
    "At least 1 special character",
    "No spaces",
  ],
};

export function validatePassword(password: string, email?: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push("Password must be at least 10 characters long.");
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push("Password must be at most 64 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number.");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must include at least one special character.");
  }

  if (/\s/.test(password)) {
    errors.push("Password cannot contain spaces.");
  }

  if (email) {
    const localPart = email.split("@")[0]?.toLowerCase();
    if (localPart && localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
      errors.push("Password cannot contain the email username.");
    }
  }

  return errors;
}
export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function isHex64(value: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

export function isLegacyAddress(value: string): boolean {
  return /^(-1:|0:)[a-fA-F0-9]{64}$/.test(value);
}

export function validateDappId(value: string): ValidationResult {
  if (!value) {
    return {
      ok: false,
      errors: ["DApp ID is required."]
    };
  }

  if (!isHex64(value)) {
    return {
      ok: false,
      errors: ["DApp ID must be a 64-character hexadecimal string."]
    };
  }

  return {
    ok: true,
    errors: []
  };
}

export function validateAccountId(value: string): ValidationResult {
  if (!value) {
    return {
      ok: false,
      errors: ["Account ID is required."]
    };
  }

  if (!isHex64(value)) {
    return {
      ok: false,
      errors: ["Account ID must be a 64-character hexadecimal string."]
    };
  }

  return {
    ok: true,
    errors: []
  };
}

export function validateLegacyAddress(value: string): ValidationResult {
  if (!value) {
    return {
      ok: false,
      errors: ["Legacy address is required."]
    };
  }

  if (!isLegacyAddress(value)) {
    return {
      ok: false,
      errors: ["Legacy address must use -1:<64hex> or 0:<64hex> format."]
    };
  }

  return {
    ok: true,
    errors: []
  };
}

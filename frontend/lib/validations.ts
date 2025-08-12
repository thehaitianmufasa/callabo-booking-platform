export function formatPhoneNumber(value: string): string {
  const phoneNumber = value.replace(/\D/g, '');
  
  if (phoneNumber.length === 0) return '';
  if (phoneNumber.length <= 3) {
    return `(${phoneNumber}`;
  }
  if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 && /^[2-9]\d{9}$/.test(cleanPhone);
}

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatPhoneForDisplay(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 10) {
    return formatPhoneNumber(cleaned);
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return formatPhoneNumber(cleaned.slice(1));
  }
  return phone;
}
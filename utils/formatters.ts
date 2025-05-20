import { formatUnits } from 'viem';

/**
 * Format angka ke format display dengan pembulatan dan penambahan koma
 */
export function formatAmount(amount: bigint | string | number, decimals: number = 18, displayDecimals: number = 6): string {
  if (typeof amount === 'bigint') {
    const formatted = formatUnits(amount, decimals);
    return parseFloat(formatted).toFixed(displayDecimals);
  }
  
  if (typeof amount === 'string') {
    if (!amount || amount === '0') return '0';
    
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) return '0';
      
      return parsedAmount.toFixed(displayDecimals);
    } catch (e) {
      return '0';
    }
  }
  
  if (typeof amount === 'number') {
    if (isNaN(amount)) return '0';
    return amount.toFixed(displayDecimals);
  }
  
  return '0';
}

/**
 * Format alamat wallet dengan mempersingkat bagian tengah
 */
export function formatAddress(address: string | undefined, chars: number = 4): string {
  if (!address) return '';
  if (address.length < 10) return address;
  
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Format persentase dengan menambahkan simbol %
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format harga dengan simbol mata uang
 */
export function formatPrice(price: number, currency: string = '$', decimals: number = 2): string {
  return `${currency}${price.toFixed(decimals)}`;
}

/**
 * Cek apakah string adalah alamat valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
} 
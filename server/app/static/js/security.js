/**
 * Hash function using SHA-256
 * @param message message to be hashed
 * @returns {Promise<string>}
 */
async function hash(message) {
  // Convert the message string to an ArrayBuffer
  const msgBuffer = new TextEncoder().encode(message);

  // Hash the message using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert the ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

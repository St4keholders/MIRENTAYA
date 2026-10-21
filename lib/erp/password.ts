import { scrypt, randomBytes, timingSafeEqual, createHash } from 'crypto';

function scryptKdf(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;

/**
 * Hash legacy con sha256 y sal estática
 */
export function hashLegacySha256(pwd: string): string {
  return createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
}

/**
 * Hash con scrypt: formato scrypt$<N>$<r>$<p>$<salt_b64>$<hash_b64>
 * Sal aleatoria de 16 bytes por usuario
 */
export async function hashPasswordScrypt(pwd: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptKdf(pwd, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 32 * 1024 * 1024,
  });

  const saltB64 = salt.toString('base64');
  const hashB64 = derivedKey.toString('base64');
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${saltB64}$${hashB64}`;
}

/**
 * Verifica una contraseña contra el hash almacenado.
 * Retorna { valid: boolean, needsRehash: boolean }
 */
export async function verifyPassword(
  pwd: string,
  storedHash: string,
  algo?: string | null
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!storedHash) return { valid: false, needsRehash: false };

  // Caso legado: sha256_v1 o formato hexadecimal sin prefijo scrypt
  if (algo === 'sha256_v1' || !storedHash.startsWith('scrypt$')) {
    const legacy = hashLegacySha256(pwd);
    const a = Buffer.from(legacy);
    const b = Buffer.from(storedHash);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return { valid, needsRehash: valid };
  }

  // Caso scrypt
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return { valid: false, needsRehash: false };
    }

    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = Buffer.from(parts[4], 'base64');
    const expectedKey = Buffer.from(parts[5], 'base64');

    const derivedKey = await scryptKdf(pwd, salt, expectedKey.length, {
      N,
      r,
      p,
      maxmem: 32 * 1024 * 1024,
    });

    const valid = derivedKey.length === expectedKey.length && timingSafeEqual(derivedKey, expectedKey);
    return { valid, needsRehash: false };
  } catch (err) {
    console.error('[password] Error verificando scrypt hash:', err);
    return { valid: false, needsRehash: false };
  }
}

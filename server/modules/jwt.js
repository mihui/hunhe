import { createPrivateKey, createPublicKey } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { VARS } from './vars.js';

const jwt = {
  /**
   * Generate token
   * 
   * @param {string} sub Subject (ID)
   * @param {number | string} expirationTime Expiration time
   * @returns {Promise<string>} Token
   */
  generateToken: async (sub, expirationTime, payload = {}, iatDate = new Date()) => {
    const keyPath = resolve('certs', 'jwt', 'jwt_private.key');
    const keyStream = readFileSync(keyPath, 'utf8');
    const privateKey = createPrivateKey({ key: keyStream });
    const issueAt = jwt.epoch(iatDate);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: VARS.JWT_ALGORITHM })
      .setIssuedAt(issueAt)
      .setIssuer(VARS.JWT_ISSUER)
      .setAudience(VARS.JWT_AUDIENCE)
      .setExpirationTime(expirationTime)
      .setSubject(sub)
      .setJti(randomUUID())
      .sign(privateKey);
    return token;
  },
  /**
   * Verify token
   * 
   * @param {string} token Token string
   * @returns {Promise<import('jose').JWTVerifyResult>} Payload & protected header
   */
  verifyToken: async (token) => {
    const keyPath = resolve('certs', 'jwt', 'jwt_private.key.pub');
    const keyStream = readFileSync(keyPath, 'utf8');
    const publicKey = createPublicKey({ key: keyStream });
    const result = await jwtVerify(token, publicKey, {
      issuer: VARS.JWT_ISSUER,
      audience: VARS.JWT_AUDIENCE
    });
    return result;
  },
  epoch: (date) => {
    return Math.floor(date.getTime() / 1000);
  }
};

export default jwt;


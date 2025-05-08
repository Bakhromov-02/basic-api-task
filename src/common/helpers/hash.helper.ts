import * as argon2 from 'argon2';

export class HashHelper {
  /**
   * Hashes a given plain text string using Argon2 hashing algorithm.
   *
   * @param {string} str - The plain text string to be hashed.
   * @returns {Promise<string>} - A promise that resolves to the hashed representation of the input string.
   */
  public static async hash(str: string): Promise<string> {
    return await argon2.hash(str);
  }

  /**
   * Verifies a plain text string against its encrypted counterpart using Argon2 hashing.
   *
   * @param {string} encrypted - The encrypted text stored in the database.
   * @param {string} plain - The plain text entered by the user for verification.
   * @returns {Promise<boolean>} - A promise that resolves to true if the plain text matches the encrypted text, false otherwise.
   */
  public static async verify(
    encrypted: string,
    plain: string,
  ): Promise<boolean> {
    return await argon2.verify(encrypted, plain);
  }
}

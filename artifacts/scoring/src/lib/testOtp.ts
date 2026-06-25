/** Fixed OTP for phone login while SMS provider is not configured. */

export const TEST_OTP_CODE = '2255';

/** Password used for test OTP accounts when edge function is unavailable. */
export const TEST_PHONE_PASSWORD = `VscorTest${TEST_OTP_CODE}!`;

/** Enabled unless VITE_DISABLE_TEST_OTP=true (testing phase default). */
export function isTestOtpEnabled(): boolean {
  return import.meta.env.VITE_DISABLE_TEST_OTP !== 'true';
}

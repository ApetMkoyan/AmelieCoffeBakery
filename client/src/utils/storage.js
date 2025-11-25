/**
 * LocalStorage utility functions
 */

const SUPERVISOR_TOKEN_KEY = "amelieSupervisorToken";
const SUPERVISOR_EMAIL_KEY = "amelieSupervisorEmail";

/**
 * Loads supervisor token from localStorage
 */
export function loadSupervisorToken() {
  return localStorage.getItem(SUPERVISOR_TOKEN_KEY) || "";
}

/**
 * Saves supervisor token to localStorage
 */
export function saveSupervisorToken(token) {
  localStorage.setItem(SUPERVISOR_TOKEN_KEY, token);
}

/**
 * Loads supervisor email from localStorage
 */
export function loadSupervisorEmail() {
  return localStorage.getItem(SUPERVISOR_EMAIL_KEY) || "";
}

/**
 * Saves supervisor email to localStorage
 */
export function saveSupervisorEmail(email) {
  localStorage.setItem(SUPERVISOR_EMAIL_KEY, email);
}

/**
 * Clears all supervisor data from localStorage
 */
export function clearSupervisorData() {
  localStorage.removeItem(SUPERVISOR_TOKEN_KEY);
  localStorage.removeItem(SUPERVISOR_EMAIL_KEY);
}


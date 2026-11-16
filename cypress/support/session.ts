// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

// The storefront keeps its session in localStorage under "session". This is
// the read side of the demo's src/frontend/gateways/Session.gateway.ts.
interface ISession {
  userId: string;
  currencyCode: string;
}

const sessionKey = 'session';
const defaultSession: Readonly<ISession> = Object.freeze({
  userId: crypto.randomUUID(),
  currencyCode: 'USD',
});

const isValid = (session: unknown): session is ISession =>
  typeof session === 'object' &&
  session !== null &&
  typeof (session as ISession).userId === 'string' &&
  typeof (session as ISession).currencyCode === 'string';

export const getSession = (): ISession => {
  const sessionString = localStorage.getItem(sessionKey);
  if (sessionString) {
    try {
      const parsed: unknown = JSON.parse(sessionString);
      if (isValid(parsed)) return parsed;
    } catch {
      // fall through to the default session
    }
  }
  localStorage.setItem(sessionKey, JSON.stringify(defaultSession));
  return defaultSession;
};

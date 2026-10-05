import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { api } from './api'

export type AuthStatus = { authenticated: boolean; registered: boolean }

export const getAuthStatus = () => api<AuthStatus>('/auth/status')

// Crea una passkey en este dispositivo (Face ID). La primera vez exige el SETUP_TOKEN del server.
export async function registerPasskey(setupToken?: string) {
  const optionsJSON = await api<PublicKeyCredentialCreationOptionsJSON>('/auth/register/options', { setupToken })
  await api('/auth/register/verify', await startRegistration({ optionsJSON }))
}

export async function loginWithPasskey() {
  const optionsJSON = await api<PublicKeyCredentialRequestOptionsJSON>('/auth/login/options', {})
  await api('/auth/login/verify', await startAuthentication({ optionsJSON }))
}

export const logout = () => api('/auth/logout', {})

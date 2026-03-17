import { execFile }  from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)

export type SignatureBadge = 'verified' | 'unverified' | 'tampered'

export interface SignatureStatus {
  sigFileExists: boolean
  verified:      boolean
}

export function getSignatureBadge(status: SignatureStatus): SignatureBadge {
  if (!status.sigFileExists) return 'unverified'
  return status.verified ? 'verified' : 'tampered'
}

export async function verifySkillSignature(skillPath: string): Promise<SignatureStatus> {
  const sigFile = `${skillPath}/skill.sig`
  const sigFileExists = existsSync(sigFile)

  if (!sigFileExists) {
    return { sigFileExists: false, verified: false }
  }

  try {
    await execFileAsync('cosign', ['verify-blob', '--signature', sigFile, skillPath])
    return { sigFileExists: true, verified: true }
  } catch {
    return { sigFileExists: true, verified: false }
  }
}

export interface PendingAnalysis {
  id: string
  requirement: string
}

const pendingAnalysisKey = 'req-analyzer-pending-analysis'

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return []
  return [window.sessionStorage, window.localStorage]
}

export function savePendingAnalysis(requirement: string): PendingAnalysis {
  const pendingAnalysis = {
    id: `${Date.now()}`,
    requirement,
  }

  for (const storage of getBrowserStorage()) {
    try {
      storage.setItem(pendingAnalysisKey, JSON.stringify(pendingAnalysis))
    } catch {
      // Storage can be unavailable in some embedded previews.
    }
  }

  return pendingAnalysis
}

export function readPendingAnalysis(): PendingAnalysis | null {
  for (const storage of getBrowserStorage()) {
    try {
      const rawValue = storage.getItem(pendingAnalysisKey)
      if (!rawValue) continue

      const pendingAnalysis = JSON.parse(rawValue) as Partial<PendingAnalysis>
      if (pendingAnalysis.id && pendingAnalysis.requirement?.trim()) {
        return {
          id: pendingAnalysis.id,
          requirement: pendingAnalysis.requirement,
        }
      }
    } catch {
      // Ignore malformed values and keep checking the fallback storage.
    }
  }

  return null
}

export function clearPendingAnalysis() {
  for (const storage of getBrowserStorage()) {
    try {
      storage.removeItem(pendingAnalysisKey)
    } catch {
      // Nothing to clear.
    }
  }
}

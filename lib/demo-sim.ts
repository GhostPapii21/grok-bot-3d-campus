// v1: no invented follow-ups, no bot simulation, nothing is sent anywhere.
import { demoData } from "./demo-data"

export type DemoApi = {
  snapshot: () => any
  send: (items: string[]) => void
  refreshRound: () => void
  subscribe: (fn: () => void) => () => void
}

export function createDemoSim(): DemoApi {
  const subs = new Set<() => void>()
  return {
    snapshot: () => demoData(),
    send: () => {},
    refreshRound: () => {},
    subscribe: (fn) => {
      subs.add(fn)
      return () => { subs.delete(fn) }
    },
  }
}

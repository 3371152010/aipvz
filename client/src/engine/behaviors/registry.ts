import type { BehaviorTag } from '../constants'
import type { BehaviorHandler } from './types'

export class BehaviorRegistry {
  private handlers = new Map<BehaviorTag, BehaviorHandler>()

  register(tag: BehaviorTag, handler: BehaviorHandler): this {
    this.handlers.set(tag, handler)
    return this
  }

  get(tag: BehaviorTag): BehaviorHandler | undefined {
    return this.handlers.get(tag)
  }
}

import { BehaviorRegistry } from './registry'
import {
  shooterHandler, lobberHandler, piercingHandler, trackingHandler,
  boomerangHandler, coneAoeHandler, chainAoeHandler, radialAoeHandler,
  sunProducerHandler, sunProducerGrowingHandler,
  wallHandler, wallRegenHandler, wallKnockbackHandler,
  mineHandler, spikeweedHandler, waterTrapHandler,
  eaterHandler, instant3x3Handler, instantRowHandler, instantFreezeHandler,
  launcherHandler, magnetHandler, lightHandler,
  avocadoHandler, celeryHandler, ghostPepperHandler, hotDateHandler,
  bonkChoyHandler, sporeHandler, formShiftHandler,
} from './handlers'

export const behaviorRegistry = new BehaviorRegistry()
  .register('shooter', shooterHandler)
  .register('three_way', shooterHandler) // uses same handler, checks for three_way tag
  .register('lobber', lobberHandler)
  .register('piercing', piercingHandler)
  .register('tracking', trackingHandler)
  .register('boomerang', boomerangHandler)
  .register('cone_aoe', coneAoeHandler)
  .register('chain_aoe', chainAoeHandler)
  .register('radial_aoe', radialAoeHandler)
  .register('sun_producer', sunProducerHandler)
  .register('sun_producer_growing', sunProducerGrowingHandler)
  .register('wall', wallHandler)
  .register('wall_regen', wallRegenHandler)
  .register('wall_knockback', wallKnockbackHandler)
  .register('mine', mineHandler)
  .register('spikeweed', spikeweedHandler)
  .register('water_trap', waterTrapHandler)
  .register('eater', eaterHandler)
  .register('instant_3x3', instant3x3Handler)
  .register('instant_row', instantRowHandler)
  .register('instant_freeze', instantFreezeHandler)
  .register('launcher', launcherHandler)
  .register('magnet', magnetHandler)
  .register('light', lightHandler)
  .register('avocado', avocadoHandler)
  .register('celery', celeryHandler)
  .register('ghost_pepper', ghostPepperHandler)
  .register('hot_date', hotDateHandler)
  .register('bonk_choy', bonkChoyHandler)
  .register('spore', sporeHandler)
  // Modifier tags — handled by projectile collision, not plant update
  .register('slow', {})
  .register('pushback', {})
  .register('balloon_pop', {})
  .register('butter', {})
  .register('form_shift', formShiftHandler)

export { BehaviorRegistry } from './registry'
export type { BehaviorHandler, BehaviorContext } from './types'

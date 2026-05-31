/**
 * Incremental bridge to modular src/ — loads ES module configs for the legacy client bundle.
 *
 * Exposes optional integration data on `window.CalmMindSrc` (sound/visualizer configs from
 * src/visualization/configs/visualizerConfigs.js). Other client scripts do not consume this
 * global today; it is intended for external integrators or future wiring.
 *
 * @global CalmMindSrc
 */
import { SOUND_TYPE_CONFIGS, VISUALIZER_CONFIGS } from '../../src/visualization/configs/visualizerConfigs.js';

window.CalmMindSrc = {
    version: '0.1.0',
    SOUND_TYPE_CONFIGS,
    VISUALIZER_CONFIGS,
};

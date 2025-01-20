<?php
/**
 * A Retraceur Block to use a specific text for each available locale.
 *
 * @package   Doubleur
 * @author    imath
 * @license   GPL-2.0+
 * @link      https://imathi.eu
 *
 * @retraceur-block
 * Plugin Name:        Doubleur
 * Plugin URI:         https://github.com/imath/doubleur
 * Description:        Post authors can use this block to add a version of their text translated for each each available locale.
 * Version:            1.0.0
 * Author:             imath
 * Author URI:         https://imathi.eu
 * Requires Retraceur: 1.0.0-beta1
 * Up to Retraceur:    1.0.0
 * Requires PHP:       5.6
 * Text Domain:        doubleur
 * License:            MIT License
 * License URI:        https://github.com/imath/doubleur/blob/master/LICENSE.md
 * Domain Path:        /languages/
 * GitHub Plugin URI:  https://github.com/imath/doubleur
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Doubleur Block.
 *
 * @since 1.0.0
 */
function doubleur_block_init() {
	register_block_type( dirname( __FILE__ ) . '/build' );
}
add_action( 'init', 'doubleur_block_init' );

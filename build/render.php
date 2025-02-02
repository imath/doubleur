<?php
/**
 * Doubleur renderer.
 *
 * @package Doubleur\build
 *
 * @since  1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $block->parsed_block['innerBlocks'] ) ) {
	return;
}

$locale          = strtolower( str_replace( '_', '-', doubleur_get_locale() ) );
$dubbed_contents = $block->parsed_block['innerBlocks'];

foreach ( $dubbed_contents as $dubbed_content ) {
	if ( ! isset( $dubbed_content['attrs']['language'] ) || $locale !== $dubbed_content['attrs']['language'] || ! isset( $dubbed_content['innerBlocks'] ) ) {
		continue;
	}

	foreach ( $dubbed_content['innerBlocks'] as $inner_block ) {
		if ( ! isset( $inner_block['innerHTML'] ) ) {
			continue;
		}

		echo $inner_block['innerHTML'];
	}
}

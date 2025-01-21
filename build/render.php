<?php

if ( ! isset( $block->parsed_block['innerBlocks'] ) ) {
	return;
}

$locale          = strtolower( str_replace( '_', '-', get_locale() ) );
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

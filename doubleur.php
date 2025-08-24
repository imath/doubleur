<?php
/**
 * A Retraceur Block to dub the post or page content in english.
 *
 * @package   Doubleur
 * @author    imath
 * @license   MIT
 * @link      https://imathi.eu
 *
 * @retraceur-block
 * Plugin Name:        Doubleur
 * Plugin URI:         https://github.com/imath/doubleur
 * Plugin Type:        block
 * Description:        Authors can use this block to dub the post or page content in english.
 * Version:            1.2.0
 * Author:             imath
 * Author URI:         https://imathi.eu
 * Requires Retraceur: 1.0.0
 * Up to Retraceur:    2.0.0
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

/**
 * Add rewrite rules for Post and Page translations.
 *
 * @since 1.0.0
 */
function doubleur_add_rewrite_rules() {
	global $wp_rewrite;

	add_rewrite_tag(
		'%translate%',
		'([^/]+)'
	);

	$patterns = array(
		'/%year%/%monthnum%' => array(
			'pattern' => '([0-9]{4})/([0-9]{1,2})/',
			'query'   => '?year=$matches[1]&monthnum=$matches[2]&name=$matches[3]&translate=$matches[4]',
		),
		'/%year%/%monthnum%/%day%' => array(
			'pattern' => '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/',
			'query'   => '?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&name=$matches[4]&translate=$matches[5]',
		),
		'/archives/%post_id%' => array(
			'pattern' => 'archives/',
			'query'   => '?p=$matches[1]&translate=$matches[2]',
		),
	);

	$permalink_structure = rtrim( str_replace( '%postname%/', '', $wp_rewrite->permalink_structure ), '/' );
	if ( isset( $patterns[ $permalink_structure ] )  ) {
		$post_base  = $patterns[ $permalink_structure ]['pattern'] . '([^/]+)/';
		$post_query = $patterns[ $permalink_structure ]['query'];
	} else {
		$post_base  = '(.?.+?)/';
		$post_query = '?name=$matches[1]&translate=$matches[2]';
	}

	$rewrite_rules = array(
		// Page
		'([^/]+)/translate/?([^/]+)/?$'      => '?pagename=$matches[1]&translate=$matches[2]',

		// Post
		$post_base . 'translate/?([^/]+)/?$' => $post_query,
	);

	foreach ( $rewrite_rules as $regex => $rewrite_rule ) {
		add_rewrite_rule(
			$regex,
			$wp_rewrite->index . $rewrite_rule,
			'top'
		);
	}
}
add_action( 'init', 'doubleur_add_rewrite_rules', 11 );

/**
 * Get the available locales.
 *
 * @since 1.0.0
 *
 * @return boolean|array False if no other locales than en_US, the list of locales otherwise.
 */
function doubleur_get_languages() {
	$languages = get_available_languages();
	$locale    = get_locale();

	if ( ! $languages ) {
		return false;
	}

	$default = array( 'en_US' );
	if ( 'en_US' !== $locale ) {
		array_unshift( $default, $locale );
	}

	return array_unique( array_merge( $default, $languages ) );
}

/**
 * Get a locale out of a language slug.
 *
 * @since 1.0.0
 *
 * @param  string $slug   The language slug.
 * @return boolean|string False if no locale was found. The locale otherwise.
 */
function doubleur_get_locale_from_slug( $slug = '' ) {
	if ( ! $slug ) {
		return false;
	}

	$country = substr( $slug, -2 );
	$locale  = str_replace( '-' . $country, '_' . strtoupper( $country ), $slug );

	if ( false !== array_search( $locale, doubleur_get_languages() ) ) {
		return $locale;
	}

	return false;
}

/**
 * Get the locale according to current page slug.
 *
 * @since 1.0.0
 *
 * @return string The locale to use for the doubleur block.
 */
function doubleur_get_locale() {
	$locale = get_locale();
	$qv     = doubleur_get_locale_from_slug( get_query_var( 'translate' ) );

	if ( $qv ) {
		$locale = $qv;
	}

	return $locale;
}

/**
 * Get the translated version of a page or post link.
 *
 * @since 1.0.0
 *
 * @param  string $link   The permalink of the Post or the Page.
 * @param  string $locale The locale of the translated version.
 * @return string         The link to display the translated version.
 */
function doubleur_get_translated_link( $link = '', $locale = '' ) {
	if ( ! $locale ) {
		$locale = strtolower( str_replace( '_', '-', get_locale() ) );
	}

	if ( get_option( 'permalink_structure' ) ) {
		$link = trailingslashit( $link ) . 'translate/' . $locale . '/';
	} else {
		$link = add_query_arg( 'translate', $locale, $link );
	}

	return $link;
}

/**
 * Filters the block editor settings to pass available languages to Post context.
 *
 * @since 1.0.0
 *
 * @param array                   $editor_settings      Default editor settings.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 * @return array The block editor settings.
 */
function doubleur_block_editor_settings( $settings, $context ) {
	if ( ! empty( $context->post ) ) {
		$settings['doubleur'] = doubleur_get_languages();
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'doubleur_block_editor_settings', 10, 2 );

/**
 * Renders the tabs to switch locales.
 *
 * @since 1.0.0
 *
 * @param string $content The content of the post/page.
 */
function doubleur_render_language_switcher( $content = '' ) {
	if ( is_singular() && has_block( 'imath/doubleur' )  ) {
		$locales       = doubleur_get_languages();
		$site_locale   = get_locale();
		$locale_in_use = doubleur_get_locale();

		if ( ! $locale_in_use ) {
			$locale_in_use = $site_locale;
		}

		$switcher = '';

		foreach ( $locales as $locale ) {
			$class = '';
			if ( $locale_in_use === $locale ) {
				$class = ' current-locale';
			}

			$link     = get_permalink();
			$language = strtolower( str_replace( '_', '-', $locale ) );

			if ( $site_locale !== $locale ) {
				$link = doubleur_get_translated_link( $link, $language );
			}

			$switcher .= sprintf( '<li class="nav-%1$s%2$s">
				<a href="%3$s">
					<span class="screen-reader-text">%4$s</span></a>
				</li>%5$s',
				$locale,
				$class,
				$link,
				$locale,
				"\n"
			);
		}

		$block_reader = new WP_HTML_Tag_Processor( $content );
		$block_reader->next_tag();

		$container_class = $block_reader->get_attribute( 'class' );
		$content         = sprintf( '<nav class="%1$s"><ul class="doubleur-i18n-switcher">%2$s</ul></nav>%3$s', $container_class, $switcher, "\n" ) . $content;
	}

	return $content;
}
add_filter( 'render_block_core/post-content', 'doubleur_render_language_switcher' );

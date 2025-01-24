/**
 * The doubleur blocks.
 *
 * @author imath.
 * @since  1.0.0
 */

/**
 * WP dependencies.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies.
 */
import './index.scss';
import './style.scss';
import metadata from './block.json';

/**
 * Get a list of the site's available locales.
 *
 * @since 1.0.O
 *
 * @return {array} The list of available locales.
 */
const getAvailableLanguages = () => {
	const languages = useSelect( ( select ) => {
		const { doubleur } = select( 'core/editor' ).getEditorSettings();
		return doubleur;
	}, [] );

	return languages;
}

// Register the locale container.
registerBlockType( 'imath/doublage', {
	apiVersion: 3,
	title: __( 'Dubbing', 'doubleur' ),
	description: __( 'Block used to contain a specific language content.', 'doubleur' ),
	icon: 'admin-site-alt',
	parent: [ 'imath/doubleur' ],
	category: 'common',
	attributes: {
		language: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		html: false,
		inserter: false,
		renaming: false,
		interactivity: false,
	},
	edit: ( { attributes } ) => {
		const blockProps = useBlockProps( {
			className: 'doubleur-lang-' + attributes.language,
		} );

		return (
			<div { ...blockProps }>
				<InnerBlocks templateLock={ false } />
			</div>
		)
	},
	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	}
} );

// Register the main doubleur block.
registerBlockType( metadata, {
	edit: () => {
		const blockProps = useBlockProps();
		const languages = getAvailableLanguages();

		if ( ! languages ) {
			return (
				<div { ...blockProps }>
					<p>{ __( 'This block is only available when editing a Post or a Page.', 'doubleur' ) }</p>
				</div>
			);
		}

		// Locale containers are use as the Inner Blocks’ template.
		let template = [];
		languages.forEach( ( langue ) => {
			template.push( [ 'imath/doublage', { language: langue.replace( '_', '-' ).toLowerCase() } ] );
		} );

		return (
			<section { ...blockProps }>
				<InnerBlocks
					template={ template }
					templateLock="all"
				/>
			</section>
		);
	},
	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<section { ...blockProps }>
				<InnerBlocks.Content />
			</section>
		);
	},
} );

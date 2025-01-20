/**
 * WP dependencies.
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import domReady from '@wordpress/dom-ready';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies.
 */
import './index.scss';
import metadata from './block.json';

const getAvailableLanguages = () => {
	const editorSettings = useSelect( ( select ) => {
		return select( 'core/editor' ).getEditorSettings();
	}, [] );

	return editorSettings;
}

registerBlockType( metadata, {
	attributes: {
		languages: {
			type: 'number',
			default: 2,
		},
	},
	edit: ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps();

		console.log( getAvailableLanguages() );

		return (
			<div { ...blockProps }>
				<p>{ __( 'Edit block', 'doubleur' ) }</p>
			</div>
		);
	},
	save:  ( { attributes } ) => {
		return null;
	},
} );

/**
 * Do something.
 *
 * @since 1.0.0
 */
domReady( function() {} );

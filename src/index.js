/**
 * WP dependencies.
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies.
 */
import './index.scss';
import metadata from './block.json';

const getAvailableLanguages = () => {
	const languages = useSelect( ( select ) => {
		const { doubleur } = select( 'core/editor' ).getEditorSettings();
		return doubleur;
	}, [] );

	return languages;
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
		const languages = getAvailableLanguages();

		if ( ! languages ) {
			return (
				<div { ...blockProps }>
					<p>{ __( 'This block is only available when editing a Post or a Page.', 'doubleur' ) }</p>
				</div>
			);
		}

		return (
			<div { ...blockProps }>
				<p>{ __( 'Edit block', 'doubleur' ) }</p>
			</div>
		);
	},
	save: ( { attributes } ) => {
		return null;
	},
} );

/**
 * The doubleur blocks.
 *
 * @author imath.
 * @since  1.0.0
 */

/**
 * WP dependencies.
 */
import {
	registerBlockType,
	createBlock,
	serialize,
} from '@wordpress/blocks';
import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, RawHTML } from '@wordpress/element';
import { PanelBody, ToggleControl } from '@wordpress/components';

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

		return doubleur?.allLocales || [];
	}, [] );

	return languages;
}

/**
 * Get the site's default locale (used to tell apart the "original" dubbed
 * content from its translations).
 *
 * @since 1.3.0
 *
 * @return {string} The site's default locale (eg. `fr-fr`).
 */
const useDefaultLocale = () => {
	return useSelect( ( select ) => {
		const { doubleur } = select( 'core/editor' ).getEditorSettings();

		return doubleur.currentLocale || '';
	}, [] );
}

/**
 * Tells whether the block is being rendered inside the Site Editor (eg. while
 * previewing an example post through a Template), as opposed to a genuine
 * Post/Page editing screen.
 *
 * @since 1.4.0
 *
 * @return {boolean} True when rendered inside the Site Editor.
 */
const useIsSiteEditor = () => {
	return useSelect( ( select ) => {
		const { doubleur } = select( 'core/editor' ).getEditorSettings();

		return !! doubleur?.isSiteEditor;
	}, [] );
}

/**
 * Finds every other `imath/doubleur` block used inside the current post so
 * that only one of them can ever be flagged as the title translation.
 *
 * @since 1.3.0
 *
 * @param {string} clientId The client ID of the `imath/doubleur` block being edited.
 * @return {string[]} The client IDs of the other `imath/doubleur` blocks currently
 *                     flagged as the title translation.
 */
const useOtherTitleTranslationBlocks = ( clientId ) => {
	return useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockName, getBlockAttributes } = select( 'core/block-editor' );

		return getClientIdsWithDescendants().filter( ( id ) => {
			return (
				id !== clientId &&
				getBlockName( id ) === 'imath/doubleur' &&
				!! getBlockAttributes( id )?.useAsTitleTranslation
			);
		} );
	}, [ clientId ] );
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
	usesContext: [ 'doubleur/useAsTitleTranslation' ],
	supports: {
		html: false,
		inserter: false,
		renaming: false,
		interactivity: false,
	},
	edit: ( { attributes, clientId, context } ) => {
		const { language } = attributes;
		const useAsTitleTranslation = !! context[ 'doubleur/useAsTitleTranslation' ];
		const defaultLocale = useDefaultLocale();
		const isDefaultLocale = language === defaultLocale;
		const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

		const innerBlocks = useSelect(
			( select ) => select( 'core/block-editor' ).getBlocks( clientId ),
			[ clientId ]
		);

		// While this instance is used to translate the title, make sure it
		// only ever contains a single level 1 Heading block, and nothing else.
		useEffect( () => {
			if ( ! useAsTitleTranslation || isDefaultLocale ) {
				return;
			}

			const hasOnlyTitleHeading = innerBlocks.length === 1
				&& innerBlocks[ 0 ].name === 'core/heading'
				&& 1 === innerBlocks[ 0 ].attributes.level;

			if ( ! hasOnlyTitleHeading ) {
				replaceInnerBlocks(
					clientId,
					[ createBlock( 'core/heading', { level: 1 } ) ],
					false
				);
			}
		}, [ useAsTitleTranslation, isDefaultLocale, innerBlocks ] );

		const blockProps = useBlockProps( {
			className: 'doubleur-lang-' + language,
		} );

		// The site's default locale already has its title set through the
		// Post/Page title field: hide this instance while in this mode so
		// only the translated version(s) remain visible.
		if ( useAsTitleTranslation && isDefaultLocale ) {
			return (
				<div { ...blockProps } className={ blockProps.className + ' doubleur-title-translation-hidden' } />
			);
		}

		return (
			<div { ...blockProps }>
				<InnerBlocks
					templateLock={ useAsTitleTranslation ? 'all' : false }
					template={ useAsTitleTranslation ? [ [ 'core/heading', { level: 1 } ] ] : undefined }
					allowedBlocks={ useAsTitleTranslation ? [ 'core/heading' ] : undefined }
				/>
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
	edit: ( { attributes, setAttributes, clientId } ) => {
		const blockProps = useBlockProps();
		const languages = getAvailableLanguages();
		const defaultLocale = useDefaultLocale();
		const isSiteEditor = useIsSiteEditor();
		const { useAsTitleTranslation } = attributes;
		const otherTitleTranslationBlocks = useOtherTitleTranslationBlocks( clientId );
		const isDisabledByAnotherBlock = ! useAsTitleTranslation && otherTitleTranslationBlocks.length > 0;

		const innerBlocks = useSelect(
			( select ) => select( 'core/block-editor' ).getBlocks( clientId ),
			[ clientId ]
		);

		/*
		 * The Site Editor only ever shows a preview of an example Post/Page
		 * (eg. while editing a Template): mirror what the front-end would
		 * output rather than the multilingual authoring UI. A block flagged
		 * as the title translation renders nothing on the front-end, and a
		 * read-only preview of the default locale's content is shown otherwise.
		 */
		if ( isSiteEditor ) {
			if ( useAsTitleTranslation ) {
				return null;
			}

			const defaultLocaleBlock = innerBlocks.find(
				( block ) => block.attributes.language === defaultLocale
			);

			if ( ! defaultLocaleBlock || ! defaultLocaleBlock.innerBlocks.length ) {
				return null;
			}

			return (
				<div { ...blockProps }>
					<RawHTML>{ serialize( defaultLocaleBlock.innerBlocks ) }</RawHTML>
				</div>
			);
		}

		const toggleTitleTranslation = ( value ) => {
			setAttributes( { useAsTitleTranslation: value } );
		};

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Title translation', 'doubleur' ) }>
					<ToggleControl
						label={ __( 'Use this block to translate the title', 'doubleur' ) }
						help={
							isDisabledByAnotherBlock
								? __( 'A Dubber block is already set to translate the title.', 'doubleur' )
								: __( 'Only one Dubber block per post can be used to translate the title.', 'doubleur' )
						}
						checked={ !! useAsTitleTranslation }
						disabled={ isDisabledByAnotherBlock }
						onChange={ toggleTitleTranslation }
					/>
				</PanelBody>
			</InspectorControls>
		);

		if ( ! languages ) {
			return (
				<>
					{ inspectorControls }
					<div { ...blockProps }>
						<p>{ __( 'This block is only available when editing a Post or a Page.', 'doubleur' ) }</p>
					</div>
				</>
			);
		}

		// Locale containers are use as the Inner Blocks’ template.
		let template = [];
		languages.forEach( ( langue ) => {
			template.push( [ 'imath/doublage', { language: langue.replace( '_', '-' ).toLowerCase() } ] );
		} );

		return (
			<>
				{ inspectorControls }
				<section { ...blockProps }>
					<InnerBlocks
						template={ template }
						templateLock="all"
					/>
				</section>
			</>
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

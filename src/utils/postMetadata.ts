/**
 * Utilities for managing source metadata in shared posts
 * Metadata is embedded as HTML comments to track the source (Event/Campaign) of shared posts
 */

export interface SourceMetadata {
    type: 'event' | 'campaign';
    id: string;
    familyTreeId?: string; // For events, to handle cross-family-tree navigation
    title?: string; // Optional, for display purposes
}

const METADATA_PREFIX = '<!-- SOURCE_METADATA:';
const METADATA_SUFFIX = '-->';

/**
 * Embeds source metadata as an HTML comment in the post content
 * The metadata is invisible when rendered as HTML but can be extracted programmatically
 * 
 * @param content - The original post content
 * @param metadata - Source metadata to embed
 * @returns Content with embedded metadata
 */
export function embedSourceMetadata(content: string, metadata: SourceMetadata): string {
    const metadataJson = JSON.stringify(metadata);
    const metadataComment = `${METADATA_PREFIX} ${metadataJson} ${METADATA_SUFFIX}`;

    // Prepend metadata to content so it doesn't interfere with display
    return `${metadataComment}\n${content}`;
}

/**
 * Extracts source metadata from post content
 * 
 * @param content - Post content that may contain embedded metadata
 * @returns Parsed metadata object or null if not found
 */
export function extractSourceMetadata(content: string): SourceMetadata | null {
    if (!content) return null;

    try {
        const startIndex = content.indexOf(METADATA_PREFIX);
        if (startIndex === -1) return null;

        const endIndex = content.indexOf(METADATA_SUFFIX, startIndex);
        if (endIndex === -1) return null;

        const metadataJson = content.substring(
            startIndex + METADATA_PREFIX.length,
            endIndex
        ).trim();

        const metadata = JSON.parse(metadataJson) as SourceMetadata;

        // Validate metadata structure
        if (!metadata.type || !metadata.id) return null;
        if (metadata.type !== 'event' && metadata.type !== 'campaign') return null;

        return metadata;
    } catch (error) {
        console.error('Failed to extract source metadata:', error);
        return null;
    }
}

/**
 * Removes metadata comments from content for clean display
 * This should be used when rendering post content to users
 * 
 * @param content - Post content with potential metadata
 * @returns Content without metadata comments
 */
export function removeMetadataFromDisplay(content: string): string {
    if (!content) return content;

    const startIndex = content.indexOf(METADATA_PREFIX);
    if (startIndex === -1) return content;

    const endIndex = content.indexOf(METADATA_SUFFIX, startIndex);
    if (endIndex === -1) return content;

    // Remove metadata comment and any trailing newline
    const beforeMetadata = content.substring(0, startIndex);
    const afterMetadata = content.substring(endIndex + METADATA_SUFFIX.length);

    // Clean up any extra newlines
    return (beforeMetadata + afterMetadata).trim();
}

/**
 * Checks if content contains source metadata
 * 
 * @param content - Post content to check
 * @returns True if metadata is present
 */
export function hasSourceMetadata(content: string): boolean {
    return content?.includes(METADATA_PREFIX) ?? false;
}

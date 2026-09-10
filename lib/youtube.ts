const VALID_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from any common YouTube URL format.
 * Supported:
 *   https://www.youtube.com/watch?v=VIDEOID[&...]
 *   https://youtu.be/VIDEOID[?...]
 *   https://www.youtube.com/shorts/VIDEOID[?...]
 *   https://www.youtube.com/embed/VIDEOID[?...]
 *   m.youtube.com variants, with or without https://, with or without www.
 *
 * Returns the 11-char video id if parseable and valid, or null.
 */
export function extractYouTubeVideoId(url: string): string | null {
  // youtu.be/VIDEOID
  let m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/);
  if (m) return VALID_ID.test(m[1]) ? m[1] : null;

  // ?v=VIDEOID or &v=VIDEOID (watch URLs)
  m = url.match(/[?&]v=([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/);
  if (m) return VALID_ID.test(m[1]) ? m[1] : null;

  // /shorts/VIDEOID or /embed/VIDEOID
  m = url.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/);
  if (m) return VALID_ID.test(m[1]) ? m[1] : null;

  return null;
}

/**
 * Scans free text for the FIRST YouTube link of any supported form and returns
 * its 11-char video id, or null if no link is found.
 * Only the leftmost match is returned — one preview per post/comment.
 * Shares the same VALID_ID guard as extractYouTubeVideoId so both functions
 * agree on what constitutes a valid id.
 */
export function findFirstYouTubeVideoId(text: string): string | null {
  // Combined regex covers all supported forms in a single left-to-right pass:
  //   youtu.be/VIDEOID
  //   ?v=VIDEOID  or  &v=VIDEOID  (watch URLs, any param order)
  //   /shorts/VIDEOID  or  /embed/VIDEOID
  // The (?:[^A-Za-z0-9_-]|$) boundary rejects ids longer than 11 chars or
  // ids embedded in a longer path segment.
  const re =
    /(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed)\/)([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (VALID_ID.test(m[1])) return m[1];
  }
  return null;
}

export function youTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

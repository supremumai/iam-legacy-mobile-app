export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  followers_count: number;
  following_count: number;
  points: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export type ProfileWithTopics = Profile & { topics: Topic[] };

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string | null;
  topic_id: string | null;
  post_type: 'text' | 'poll';
}

export interface PostAuthor {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export type PostWithAuthor = Post & { author: PostAuthor | null; topic: Topic | null };

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export type CommentWithAuthor = Comment & { author: PostAuthor | null };

export type ThreadedComment = CommentWithAuthor & {
  replies: CommentWithAuthor[];
};

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: 'post_like' | 'post_comment' | 'comment_reply';
  post_id: string;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationWithActor = NotificationItem & { actor: PostAuthor | null };

export interface MemberListItem {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  location: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface Resource {
  id: string;
  submitted_by: string;
  topic_id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string | null;
  channel_name: string | null;
  duration_seconds: number | null;
  likes_count: number;
  views_count: number;
  created_at: string;
}

export type ResourceWithMeta = Resource & {
  submitter: PostAuthor | null;
  topic: Topic | null;
};

// ─── Poll types ───────────────────────────────────────────────────────────────

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  allow_multiple: boolean;
  closes_at: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
  votes_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  poll_option_id: string;
  user_id: string;
  created_at: string;
}

/**
 * A poll with its options (sorted by sort_order), the current user's voted
 * option ids (empty = not voted), and the total vote count derived from
 * poll_options.votes_count (maintained by DB triggers, never recounted here).
 */
export interface PollWithMeta {
  poll: Poll;
  options: PollOption[];
  /** Empty when the user has not voted. One id for single-choice; multiple for allow_multiple. */
  userVotedOptionIds: string[];
  total_votes: number;
}

export interface EventItem {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  event_date: string | null;
  is_online: boolean | null;
  attendees_count: number | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string | null;
}

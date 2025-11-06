-- Demo Data for Bright Pearl Platform
-- 10 realistic islamophobic content reports with varied data

-- Clear existing demo data (optional)
-- DELETE FROM reports WHERE id BETWEEN 1 AND 10;

-- Insert demo reports
INSERT INTO reports (
  id,
  content_link,
  content_link_normalized,
  platform,
  country,
  language,
  content_type,
  description,
  activity_status,
  status,
  report_count,
  submitter_ip_hash,
  created_at,
  updated_at
) VALUES
-- Report 1: Twitter tweet - Multiple reports
(
  1,
  'https://twitter.com/example1/status/1234567890',
  'https://twitter.com/example1/status/1234567890',
  'twitter',
  'US',
  'en',
  'tweet',
  'Tweet contains dehumanizing language targeting Muslims, comparing them to animals. Violates Twitter hate speech policy.',
  'active',
  'approved',
  47,
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days'
),

-- Report 2: Facebook post - Deleted by platform
(
  2,
  'https://facebook.com/example.page/posts/9876543210',
  'https://facebook.com/example.page/posts/9876543210',
  'facebook',
  'GB',
  'en',
  'post',
  'Post advocates for violence against mosques. Explicit threats made. Reported multiple times before removal.',
  'deleted',
  'approved',
  152,
  '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
),

-- Report 3: YouTube video - Still active
(
  3,
  'https://youtube.com/watch?v=abc123def456',
  'https://youtube.com/watch?v=abc123def456',
  'youtube',
  'FR',
  'fr',
  'video',
  'Video spreads conspiracy theories about Islamic immigration. Uses misleading statistics and fear-mongering.',
  'active',
  'approved',
  89,
  '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days'
),

-- Report 4: Instagram post - Pending moderation
(
  4,
  'https://instagram.com/p/ABCD1234EFG/',
  'https://instagram.com/p/abcd1234efg/',
  'instagram',
  'DE',
  'de',
  'post',
  'Post uses islamophobic stereotypes and memes. Dog-whistle content disguised as humor.',
  'active',
  'pending',
  12,
  'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),

-- Report 5: TikTok video - High report count
(
  5,
  'https://tiktok.com/@user123/video/7890123456',
  'https://tiktok.com/@user123/video/7890123456',
  'tiktok',
  'IN',
  'en',
  'video',
  'Viral video promoting anti-Muslim hate. 2M+ views. Claims Muslims are taking over. Spreads misinformation.',
  'active',
  'approved',
  234,
  '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '6 days'
),

-- Report 6: Reddit post - Deleted
(
  6,
  'https://reddit.com/r/example/comments/xyz789/islamophobic_post',
  'https://reddit.com/r/example/comments/xyz789/islamophobic_post',
  'reddit',
  'CA',
  'en',
  'post',
  'Reddit post in large subreddit calling for ban on Muslim immigration. Thousands of upvotes before removal.',
  'deleted',
  'approved',
  67,
  'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '14 days'
),

-- Report 7: Twitter reply - Arabic content
(
  7,
  'https://twitter.com/user789/status/1111222233?reply=444555666',
  'https://twitter.com/user789/status/1111222233',
  'twitter',
  'SA',
  'ar',
  'reply',
  'Reply to news article contains explicit hate speech in Arabic targeting Shia Muslims. Sectarian violence incitement.',
  'active',
  'approved',
  28,
  '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),

-- Report 8: Facebook comment - Rejected (not islamophobic)
(
  8,
  'https://facebook.com/somepost/comments/123456',
  'https://facebook.com/somepost/comments/123456',
  'facebook',
  'AU',
  'en',
  'comment',
  'Comment critiques specific policy without targeting Muslims as a group. Does not meet criteria for islamophobia.',
  'active',
  'rejected',
  3,
  '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '12 hours'
),

-- Report 9: YouTube comment - Pending
(
  9,
  'https://youtube.com/watch?v=xyz789&lc=commentid123',
  'https://youtube.com/watch?v=xyz789&lc=commentid123',
  'youtube',
  'PK',
  'ur',
  'comment',
  'Comment on religious video contains hate speech in Urdu. Calls for violence against specific Muslim sect.',
  'active',
  'pending',
  8,
  '19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),

-- Report 10: Instagram reel - Multiple reports
(
  10,
  'https://instagram.com/reel/QWERTY12345/',
  'https://instagram.com/reel/qwerty12345/',
  'instagram',
  'AE',
  'ar',
  'reel',
  'Viral reel with 500K+ views promoting anti-Muslim conspiracy theories. Uses AI-generated imagery to spread fear.',
  'active',
  'approved',
  178,
  '4ec9599fc203d176a301536c2e091a19bc852759b255bd6818810a42c5fed14a',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '3 days'
);

-- Reset sequence to start at 11 for new reports
SELECT setval('reports_id_seq', 11, false);

-- Create some additional summary stats for demo
COMMENT ON TABLE reports IS 'Demo data includes 10 reports: 6 approved, 2 pending, 1 rejected. Total report_count: 818';

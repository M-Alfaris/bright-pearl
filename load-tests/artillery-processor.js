// Artillery Custom Processor
// Provides helper functions for load testing

module.exports = {
  // Generate random string for unique content
  generateRandomString,
  // Generate realistic report data
  generateReportData,
  // Custom metrics
  recordCustomMetrics,
};

/**
 * Generate random alphanumeric string
 */
function generateRandomString(context, events, done) {
  context.vars.randomId = Math.random().toString(36).substring(2, 15);
  return done();
}

/**
 * Generate realistic report data
 */
function generateReportData(context, events, done) {
  const platforms = ['YouTube', 'Facebook', 'Instagram', 'Twitter', 'TikTok', 'Snapchat'];
  const contentTypes = ['video', 'image', 'text', 'live_stream', 'story'];
  const countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'SA', 'AE', 'EG'];
  const languages = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh'];

  const descriptions = [
    'Contains harmful content that violates community guidelines',
    'Inappropriate content targeting minors',
    'Hate speech and discriminatory language',
    'Violent or graphic content',
    'Misinformation and false claims',
    'Spam or fraudulent activity',
    'Harassment and bullying behavior',
  ];

  context.vars.reportData = {
    link: `https://example.com/content/${context.vars.randomId}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    content_type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
  };

  return done();
}

/**
 * Record custom metrics
 */
function recordCustomMetrics(context, events, done) {
  const startTime = Date.now();

  context.vars.startTime = startTime;

  // After response
  events.on('response', (response) => {
    const duration = Date.now() - startTime;

    // Record custom metrics
    events.emit('customStat', {
      stat: 'response_time_ms',
      value: duration,
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      events.emit('customStat', {
        stat: 'successful_requests',
        value: 1,
      });
    } else if (response.statusCode >= 400) {
      events.emit('customStat', {
        stat: 'failed_requests',
        value: 1,
      });
    }
  });

  return done();
}

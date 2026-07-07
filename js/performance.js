/**
 * GEIO Performance Monitoring - Dev/debug only
 * Remove in production
 */

const GEIOPerformance = (() => {
  const metrics = {};

  const measure = (name, callback) => {
    const start = performance.now();
    const result = callback();
    const duration = performance.now() - start;
    metrics[name] = duration;
    if (duration > 50) {
      console.warn(`⚠️ Long task detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    return result;
  };

  const report = () => {
    console.table(metrics);
    const web_vitals = {
      'FCP': performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      'LCP': performance.getEntriesByType('largest-contentful-paint')?.pop()?.startTime,
      'CLS': 0 // Computed by CLS API
    };
    console.table(web_vitals);
  };

  return { measure, report, metrics };
})();

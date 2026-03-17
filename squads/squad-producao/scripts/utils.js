/**
 * ETL Utilities
 *
 * Utility functions for ETL operations.
 */

/**
 * Format data for output
 * @param {Object} data - Data to format
 * @param {string} format - Output format (json, csv, yaml)
 * @returns {string} Formatted data
 */
function formatData(data, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      // Simple CSV conversion
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => row[h]).join(','));
        return [headers.join(','), ...rows].join('\n');
      }
      return '';
    case 'yaml':
      // Simple YAML conversion
      return Object.entries(data)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n');
    default:
      return JSON.stringify(data);
  }
}

module.exports = { formatData };

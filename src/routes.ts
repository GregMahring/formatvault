import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // Landing page
  index('routes/home.tsx'),

  // Formatter routes — one route per format, keyword-rich URLs (ADR-0003)
  route('json-formatter', 'routes/json-formatter.tsx'),
  route('csv-formatter', 'routes/csv-formatter.tsx'),
  route('yaml-formatter', 'routes/yaml-formatter.tsx'),

  // Converter routes — one route per conversion pair for SEO/GEO (ADR-0003)
  route('converters', 'routes/converters.tsx'),
  route('json-to-csv-converter', 'routes/json-to-csv-converter.tsx'),
  route('json-to-yaml-converter', 'routes/json-to-yaml-converter.tsx'),
  route('csv-to-json-converter', 'routes/csv-to-json-converter.tsx'),
  route('csv-to-yaml-converter', 'routes/csv-to-yaml-converter.tsx'),
  route('yaml-to-json-converter', 'routes/yaml-to-json-converter.tsx'),
  route('yaml-to-csv-converter', 'routes/yaml-to-csv-converter.tsx'),

  // Utility tool routes
  route('jwt-decoder', 'routes/jwt-decoder.tsx'),
  route('base64-encoder', 'routes/base64-encoder.tsx'),
  route('url-encoder', 'routes/url-encoder.tsx'),

  // 404 catch-all
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;

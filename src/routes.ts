import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // Landing page
  index('routes/home.tsx'),

  // Formatter routes — one route per format, keyword-rich URLs (ADR-0003)
  route('xml-formatter', 'routes/xml-formatter.tsx'),
  route('json-formatter', 'routes/json-formatter.tsx'),
  route('csv-formatter', 'routes/csv-formatter.tsx'),
  route('yaml-formatter', 'routes/yaml-formatter.tsx'),
  route('toml-formatter', 'routes/toml-formatter.tsx'),
  route('sql-formatter', 'routes/sql-formatter.tsx'),
  route('regex-tester', 'routes/regex-tester.tsx'),

  // Converter routes — one route per conversion pair for SEO/GEO (ADR-0003)
  route('converters', 'routes/converters.tsx'),
  route('xml-to-json-converter', 'routes/xml-to-json-converter.tsx'),
  route('json-to-xml-converter', 'routes/json-to-xml-converter.tsx'),
  route('json-to-csv-converter', 'routes/json-to-csv-converter.tsx'),
  route('json-to-yaml-converter', 'routes/json-to-yaml-converter.tsx'),
  route('csv-to-json-converter', 'routes/csv-to-json-converter.tsx'),
  route('csv-to-yaml-converter', 'routes/csv-to-yaml-converter.tsx'),
  route('yaml-to-json-converter', 'routes/yaml-to-json-converter.tsx'),
  route('yaml-to-csv-converter', 'routes/yaml-to-csv-converter.tsx'),
  route('json-to-typescript', 'routes/json-to-typescript.tsx'),
  route('toml-to-json-converter', 'routes/toml-to-json-converter.tsx'),
  route('json-to-toml-converter', 'routes/json-to-toml-converter.tsx'),
  route('toml-to-yaml-converter', 'routes/toml-to-yaml-converter.tsx'),
  route('yaml-to-toml-converter', 'routes/yaml-to-toml-converter.tsx'),

  // Utility tool routes
  route('json-schema-generator', 'routes/json-schema-generator.tsx'),
  route('jwt-decoder', 'routes/jwt-decoder.tsx'),
  route('base64-encoder', 'routes/base64-encoder.tsx'),
  route('url-encoder', 'routes/url-encoder.tsx'),
  route('hash-generator', 'routes/hash-generator.tsx'),
  route('unix-timestamp-converter', 'routes/unix-timestamp-converter.tsx'),
  route('cron-expression-explainer', 'routes/cron-expression-explainer.tsx'),
  route('color-picker', 'routes/color-picker.tsx'),
  route('number-base-converter', 'routes/number-base-converter.tsx'),

  // Static pages
  route('about', 'routes/about.tsx'),
  route('privacy', 'routes/privacy.tsx'),

  // 404 catch-all
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;

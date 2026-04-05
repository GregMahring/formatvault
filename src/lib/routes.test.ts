import { describe, it, expect } from 'vitest';
import { TOOL_ROUTES, NAV_GROUPS, getRoutesByGroup, type RouteGroup } from './routes';

// All group values that the registry declares
const ALL_GROUPS: RouteGroup[] = ['Formatters', 'Converters', 'Utilities'];

describe('TOOL_ROUTES', () => {
  it('is non-empty', () => {
    expect(TOOL_ROUTES.length).toBeGreaterThan(0);
  });

  it('every route has a unique id', () => {
    const ids = TOOL_ROUTES.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every route has a unique path', () => {
    const paths = TOOL_ROUTES.map((r) => r.path);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('every path starts with a forward slash', () => {
    for (const route of TOOL_ROUTES) {
      expect(route.path).toMatch(/^\//);
    }
  });

  it('every route id matches its path (id === path without leading slash)', () => {
    for (const route of TOOL_ROUTES) {
      expect(route.path).toBe(`/${route.id}`);
    }
  });

  it('every route belongs to a valid group', () => {
    const validGroups = new Set(ALL_GROUPS);
    for (const route of TOOL_ROUTES) {
      expect(validGroups.has(route.group)).toBe(true);
    }
  });

  it('every route has a non-empty label', () => {
    for (const route of TOOL_ROUTES) {
      expect(route.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a non-null icon (React component)', () => {
    for (const route of TOOL_ROUTES) {
      // Lucide icons are forwardRef objects, not plain functions
      expect(route.icon).toBeTruthy();
      expect(route.icon).not.toBeNull();
    }
  });

  it('keywords, when present, are non-empty arrays of strings', () => {
    const routesWithKeywords = TOOL_ROUTES.filter((r) => r.keywords !== undefined);
    expect(routesWithKeywords.length).toBeGreaterThan(0);
    for (const route of routesWithKeywords) {
      expect(Array.isArray(route.keywords)).toBe(true);
      expect(route.keywords!.length).toBeGreaterThan(0);
      for (const kw of route.keywords!) {
        expect(typeof kw).toBe('string');
        expect(kw.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('navLabel, when present, is a non-empty string shorter than label', () => {
    const routesWithNavLabel = TOOL_ROUTES.filter((r) => r.navLabel !== undefined);
    expect(routesWithNavLabel.length).toBeGreaterThan(0);
    for (const route of routesWithNavLabel) {
      expect(route.navLabel!.trim().length).toBeGreaterThan(0);
      expect(route.navLabel!.length).toBeLessThan(route.label.length);
    }
  });

  it('contains expected formatter routes', () => {
    const ids = new Set(TOOL_ROUTES.map((r) => r.id));
    expect(ids.has('json-formatter')).toBe(true);
    expect(ids.has('xml-formatter')).toBe(true);
    expect(ids.has('csv-formatter')).toBe(true);
    expect(ids.has('yaml-formatter')).toBe(true);
    expect(ids.has('toml-formatter')).toBe(true);
    expect(ids.has('sql-formatter')).toBe(true);
  });

  it('contains expected converter routes', () => {
    const ids = new Set(TOOL_ROUTES.map((r) => r.id));
    expect(ids.has('xml-to-json-converter')).toBe(true);
    expect(ids.has('json-to-csv-converter')).toBe(true);
    expect(ids.has('json-to-typescript')).toBe(true);
    expect(ids.has('yaml-to-toml-converter')).toBe(true);
  });

  it('contains expected utility routes', () => {
    const ids = new Set(TOOL_ROUTES.map((r) => r.id));
    expect(ids.has('regex-tester')).toBe(true);
    expect(ids.has('jwt-decoder')).toBe(true);
    expect(ids.has('base64-encoder')).toBe(true);
    expect(ids.has('hash-generator')).toBe(true);
    expect(ids.has('json-schema-generator')).toBe(true);
  });
});

describe('getRoutesByGroup', () => {
  it('returns only routes belonging to the requested group', () => {
    for (const group of ALL_GROUPS) {
      const result = getRoutesByGroup(group);
      for (const route of result) {
        expect(route.group).toBe(group);
      }
    }
  });

  it('union of all groups equals TOOL_ROUTES', () => {
    const all = ALL_GROUPS.flatMap((g) => getRoutesByGroup(g));
    expect(all.length).toBe(TOOL_ROUTES.length);
    const allIds = new Set(all.map((r) => r.id));
    for (const route of TOOL_ROUTES) {
      expect(allIds.has(route.id)).toBe(true);
    }
  });

  it('returns an empty array for a group with no routes (edge case)', () => {
    // Cast to bypass type constraint — simulates unknown group at runtime
    const result = getRoutesByGroup('Unknown' as RouteGroup);
    expect(result).toEqual([]);
  });

  it('preserves declaration order within each group', () => {
    for (const group of ALL_GROUPS) {
      const byGroup = getRoutesByGroup(group);
      const fromMain = TOOL_ROUTES.filter((r) => r.group === group);
      expect(byGroup.map((r) => r.id)).toEqual(fromMain.map((r) => r.id));
    }
  });
});

describe('NAV_GROUPS', () => {
  it('has exactly one entry per group, in the canonical order', () => {
    expect(NAV_GROUPS.map((g) => g.label)).toEqual(['Formatters', 'Converters', 'Utilities']);
  });

  it('each group contains the correct number of items', () => {
    for (const navGroup of NAV_GROUPS) {
      const expected = getRoutesByGroup(navGroup.label).length;
      expect(navGroup.items.length).toBe(expected);
    }
  });

  it('each item has a `to` path and a `label`', () => {
    for (const navGroup of NAV_GROUPS) {
      for (const item of navGroup.items) {
        expect(typeof item.to).toBe('string');
        expect(item.to).toMatch(/^\//);
        expect(typeof item.label).toBe('string');
        expect(item.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('items use navLabel when available', () => {
    const routesWithNavLabel = TOOL_ROUTES.filter((r) => r.navLabel !== undefined);
    for (const route of routesWithNavLabel) {
      const group = NAV_GROUPS.find((g) => g.label === route.group);
      const item = group?.items.find((i) => i.to === route.path);
      expect(item?.label).toBe(route.navLabel);
    }
  });

  it('items fall back to label when navLabel is absent', () => {
    const routesWithoutNavLabel = TOOL_ROUTES.filter((r) => r.navLabel === undefined);
    for (const route of routesWithoutNavLabel) {
      const group = NAV_GROUPS.find((g) => g.label === route.group);
      const item = group?.items.find((i) => i.to === route.path);
      expect(item?.label).toBe(route.label);
    }
  });

  it('all item paths are unique within each group', () => {
    for (const navGroup of NAV_GROUPS) {
      const paths = navGroup.items.map((i) => i.to);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});

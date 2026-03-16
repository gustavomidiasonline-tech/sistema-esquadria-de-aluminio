/**
 * RLS Validation Tests
 *
 * Validates that Row Level Security policies are correctly configured
 * by parsing the SQL migration files structurally.
 * This ensures multitenancy isolation by company_id is complete.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations');

// Tables that MUST have company_id-based RLS isolation
const BUSINESS_TABLES_WITH_COMPANY_ID = [
  'clientes',
  'fornecedores',
  'produtos',
  'orcamentos',
  'pedidos',
  'servicos',
  'planos_de_corte',
  'agenda_eventos',
  'cutting_plans',
  'inventory_items',
  'purchase_orders',
  'production_orders',
  'window_models',
  'ai_import_jobs',
  'companies',
];

// Tables that have RLS via parent FK (indirect isolation)
const TABLES_WITH_INDIRECT_RLS = [
  'cutting_pieces',
  'cutting_bars',
  'purchase_order_items',
  'production_order_items',
  'production_stages',
  'production_stage_progress',
  'window_parts',
  'materials_list',
];

let allMigrationSQL: string;

beforeAll(() => {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();

  allMigrationSQL = files
    .map((f: string) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf-8'))
    .join('\n');
});

describe('RLS Configuration Validation', () => {
  describe('AC1: All business tables have RLS enabled', () => {
    for (const table of BUSINESS_TABLES_WITH_COMPANY_ID) {
      it(`${table} should have RLS enabled`, () => {
        const pattern = new RegExp(
          `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          'i'
        );
        expect(allMigrationSQL).toMatch(pattern);
      });
    }

    for (const table of TABLES_WITH_INDIRECT_RLS) {
      it(`${table} (indirect) should have RLS enabled`, () => {
        const pattern = new RegExp(
          `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          'i'
        );
        expect(allMigrationSQL).toMatch(pattern);
      });
    }
  });

  describe('AC2: Business tables have CRUD policies', () => {
    const CRUD_OPERATIONS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

    // Tables with the standard 4-policy pattern (company_{table}_{op})
    const tablesWithStandardPolicies = [
      'clientes',
      'fornecedores',
      'produtos',
      'orcamentos',
      'pedidos',
      'servicos',
      'planos_de_corte',
      'agenda_eventos',
    ];

    for (const table of tablesWithStandardPolicies) {
      for (const op of CRUD_OPERATIONS) {
        it(`${table} should have a ${op} policy`, () => {
          // Look for CREATE POLICY ... ON public.{table} FOR {op}
          const pattern = new RegExp(
            `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}\\s+FOR\\s+${op}`,
            'i'
          );
          expect(allMigrationSQL).toMatch(pattern);
        });
      }
    }
  });

  describe('AC3: Policies use get_user_company_id() for isolation', () => {
    for (const table of BUSINESS_TABLES_WITH_COMPANY_ID) {
      it(`${table} policies should reference get_user_company_id()`, () => {
        // Find all CREATE POLICY statements for this table
        const policyPattern = new RegExp(
          `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}[\\s\\S]*?;`,
          'gi'
        );
        const policies = allMigrationSQL.match(policyPattern);

        // At least one policy should exist
        expect(policies).toBeTruthy();
        expect(policies!.length).toBeGreaterThan(0);

        // At least one policy should use get_user_company_id()
        const usesCompanyId = policies!.some((p) =>
          p.includes('get_user_company_id()')
        );
        expect(usesCompanyId).toBe(true);
      });
    }
  });

  describe('AC4: DELETE policies require admin role', () => {
    const tablesWithAdminDelete = [
      'clientes',
      'fornecedores',
      'produtos',
      'orcamentos',
      'pedidos',
      'servicos',
      'planos_de_corte',
      'agenda_eventos',
    ];

    for (const table of tablesWithAdminDelete) {
      it(`${table} DELETE policy should require admin role`, () => {
        // Find DELETE policy for this table
        const deletePattern = new RegExp(
          `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}\\s+FOR\\s+DELETE[\\s\\S]*?;`,
          'gi'
        );
        const deletePolicies = allMigrationSQL.match(deletePattern);

        expect(deletePolicies).toBeTruthy();
        expect(deletePolicies!.length).toBeGreaterThan(0);

        // Should reference admin role check
        const requiresAdmin = deletePolicies!.some(
          (p) => p.includes("has_role") && p.includes("admin")
        );
        expect(requiresAdmin).toBe(true);
      });
    }
  });

  describe('Indirect RLS tables use parent FK for isolation', () => {
    for (const table of TABLES_WITH_INDIRECT_RLS) {
      it(`${table} should have a policy referencing parent company_id`, () => {
        const policyPattern = new RegExp(
          `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+public\\.${table}[\\s\\S]*?;`,
          'gi'
        );
        const policies = allMigrationSQL.match(policyPattern);

        expect(policies).toBeTruthy();
        expect(policies!.length).toBeGreaterThan(0);

        // Should reference get_user_company_id() in a subquery
        const usesCompanyId = policies!.some((p) =>
          p.includes('get_user_company_id()')
        );
        expect(usesCompanyId).toBe(true);
      });
    }
  });

  describe('Critical security function exists', () => {
    it('get_user_company_id() function should be defined', () => {
      expect(allMigrationSQL).toMatch(
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_user_company_id\(\)/i
      );
    });

    it('get_user_company_id() should be SECURITY DEFINER', () => {
      // The function definition should include SECURITY DEFINER
      const funcPattern = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_user_company_id\(\)[\s\S]*?SECURITY\s+DEFINER/i;
      expect(allMigrationSQL).toMatch(funcPattern);
    });

    it('get_user_company_id() should query profiles table with auth.uid()', () => {
      expect(allMigrationSQL).toMatch(/SELECT\s+company_id\s+FROM\s+public\.profiles\s+WHERE\s+id\s*=\s*auth\.uid\(\)/i);
    });
  });
});

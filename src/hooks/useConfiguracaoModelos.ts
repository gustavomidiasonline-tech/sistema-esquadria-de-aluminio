import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { avaliarFormulaUnificada } from '@/lib/formula-engine';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  rule_count?: number;
}

export interface CatalogProfile {
  id: string;
  code: string;
  description: string | null;
}

export interface CutRule {
  id: string;
  product_id: string;
  profile_id: string;
  formula: string;
  quantity: number | null;
  angle: string | null;
  axis: string;
  profile?: CatalogProfile;
}

export function useConfiguracaoModelos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [profiles, setProfiles] = useState<CatalogProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cutRules, setCutRules] = useState<CutRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<CutRule | null>(null);
  const [ruleProfileId, setRuleProfileId] = useState('');
  const [ruleFormula, setRuleFormula] = useState('');
  const [ruleQty, setRuleQty] = useState('1');
  const [ruleAngle, setRuleAngle] = useState('90°');
  const [ruleAxis, setRuleAxis] = useState('L');
  const [previewL, setPreviewL] = useState('2000');
  const [previewH, setPreviewH] = useState('1000');

  useEffect(() => {
    loadProducts();
    loadProfiles();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    // Get company_id for filtering
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId || '')
      .single();

    const company_id = profile?.company_id;
    
    const query = supabase.from('mt_products').select('*');
    if (company_id) query.eq('company_id', company_id);
    
    const { data } = await query.order('name');
    const prods = (data as Product[]) || [];

    // Load rule counts for all products
    if (prods.length > 0) {
      const { data: rules } = await supabase
        .from('cut_rules')
        .select('product_id');
      if (rules) {
        const counts: Record<string, number> = {};
        for (const r of rules) {
          counts[r.product_id] = (counts[r.product_id] || 0) + 1;
        }
        for (const p of prods) {
          p.rule_count = counts[p.id] || 0;
        }
      }
    }

    setProducts(prods);
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId || '')
      .single();

    const company_id = profileData?.company_id;

    // --- Strategy: try catalog_profiles first (which cut_rules FK points to),
    // then fall back to perfis_catalogo if empty ---
    let profiles: CatalogProfile[] = [];

    if (company_id) {
      const { data: catalogData, error: catError } = await supabase
        .from('catalog_profiles')
        .select('id, code, description')
        .eq('company_id', company_id)
        .order('code');
      if (!catError) profiles = (catalogData || []) as CatalogProfile[];
    }

    // Fallback: if catalog_profiles is empty, load from perfis_catalogo
    // NOTE: select only the real column names (codigo, nome) — NO aliases
    // to avoid PostgREST encoding them as invalid column names
    if (profiles.length === 0) {
      const { data: perfisCatData, error: pcError } = await supabase
        .from('perfis_catalogo')
        .select('id, codigo, nome')
        .eq('company_id', company_id || '')
        .order('codigo');

      if (!pcError) {
        profiles = (perfisCatData || []).map((p: { id: string; codigo: string; nome: string }) => ({
          id: p.id,
          code: p.codigo,
          description: p.nome,
        }));
      }
    }

    setProfiles(profiles);
  };

  const loadCutRules = async (productId: string) => {
    setLoadingRules(true);
    // Use the cut_rules_profile_id_fkey hint to avoid PostgREST resolving
    // against the wrong related table (perfis_catalogo vs catalog_profiles)
    const { data, error } = await supabase
      .from('cut_rules')
      .select('*, profile:cut_rules_profile_id_fkey(id, code, description)')
      .eq('product_id', productId)
      .order('created_at');

    if (error) {
      console.error('Error loading cut rules (with FK hint):', error);
      // Fallback: simple select without join, profile resolved client-side later
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('cut_rules')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');
      if (fallbackError) console.error('Error loading cut rules (fallback):', fallbackError);
      setCutRules((fallbackData as CutRule[]) || []);
    } else {
      setCutRules((data as CutRule[]) || []);
    }
    setLoadingRules(false);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProductDialog(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description || '');
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim()) { toast.error('Nome obrigatório'); return; }
    const payload = { name: prodName.trim(), description: prodDesc || null, image_url: null };

    if (editingProduct) {
      const { error } = await supabase.from('mt_products').update(payload).eq('id', editingProduct.id);
      if (error) { toast.error('Erro ao atualizar: ' + error.message); return; }
      toast.success('Modelo atualizado!');
      setProductDialog(false);
      loadProducts();
    } else {
      const user = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.data.user?.id || '')
        .single();

      if (!profile?.company_id) {
        toast.error('Empresa não encontrada. Verifique seu perfil.');
        return;
      }

      const { data: newProduct, error } = await supabase
        .from('mt_products')
        .insert({ ...payload, company_id: profile.company_id })
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar modelo: ' + error.message);
        return;
      }

      toast.success('Modelo criado! Agora adicione as regras de corte.');
      setProductDialog(false);
      await loadProducts();
      setSelectedProduct({ ...newProduct as Product, rule_count: 0 });
      loadCutRules(newProduct.id);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await supabase.from('mt_products').delete().eq('id', id);
      toast.success('Modelo removido');
      loadProducts();
      if (selectedProduct?.id === id) setSelectedProduct(null);
    } catch { /* error handled */ }
  };

  const openNewRule = () => {
    setEditingRule(null);
    setRuleProfileId('');
    setRuleFormula('');
    setRuleQty('1');
    setRuleAngle('90°');
    setRuleAxis('L');
    setRuleDialog(true);
  };

  const openEditRule = (r: CutRule) => {
    setEditingRule(r);
    setRuleProfileId(r.profile_id);
    setRuleFormula(r.formula);
    setRuleQty(String(r.quantity ?? 1));
    setRuleAngle(r.angle ?? '90°');
    setRuleAxis(r.axis);
    setRuleDialog(true);
  };

  const saveRule = async () => {
    if (!ruleProfileId || !ruleFormula.trim()) { toast.error('Perfil e fórmula obrigatórios'); return; }
    const payload = {
      product_id: selectedProduct!.id,
      profile_id: ruleProfileId,
      formula: ruleFormula.trim(),
      quantity: parseInt(ruleQty) || 1,
      angle: ruleAngle,
      axis: ruleAxis,
    };
    try {
      if (editingRule) {
        await supabase.from('cut_rules').update(payload).eq('id', editingRule.id);
        toast.success('Regra atualizada!');
      } else {
        await supabase.from('cut_rules').insert(payload);
        toast.success('Regra adicionada!');
      }
      setRuleDialog(false);
      loadCutRules(selectedProduct!.id);
    } catch { /* error handled */ }
  };

  const deleteRule = async (id: string) => {
    try {
      await supabase.from('cut_rules').delete().eq('id', id);
      toast.success('Regra removida');
      loadCutRules(selectedProduct!.id);
    } catch { /* error handled */ }
  };

  const evalFormula = (formula: string, L: number, H: number): string => {
    const result = avaliarFormulaUnificada(formula, { largura: L, altura: H, folhas: 2 });
    return result === 0 && !/^[\d\s+\-*/().]+$/.test(formula) ? '—' : `${result} mm`;
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return {
    products, profiles, search, setSearch, loading,
    selectedProduct, setSelectedProduct, cutRules, loadingRules, loadCutRules,
    productDialog, setProductDialog, editingProduct, prodName, setProdName, prodDesc, setProdDesc,
    openNewProduct, openEditProduct, saveProduct, deleteProduct,
    ruleDialog, setRuleDialog, editingRule, ruleProfileId, setRuleProfileId, ruleFormula, setRuleFormula, ruleQty, setRuleQty, ruleAngle, setRuleAngle, ruleAxis, setRuleAxis,
    openNewRule, openEditRule, saveRule, deleteRule,
    previewL, setPreviewL, previewH, setPreviewH,
    evalFormula, filtered,
  };
}

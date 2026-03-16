import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
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
  const [prodImage, setProdImage] = useState('');
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
    const { data } = await supabase.from('mt_products').select('*').order('name');
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from('catalog_profiles').select('*').order('code');
    setProfiles((data as CatalogProfile[]) || []);
  };

  const loadCutRules = async (productId: string) => {
    setLoadingRules(true);
    const { data } = await supabase
      .from('cut_rules')
      .select('*, profile:catalog_profiles(id, code, description)')
      .eq('product_id', productId)
      .order('created_at');
    setCutRules((data as CutRule[]) || []);
    setLoadingRules(false);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdImage('');
    setProductDialog(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description || '');
    setProdImage(p.image_url || '');
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim()) { toast.error('Nome obrigatório'); return; }
    const payload = { name: prodName.trim(), description: prodDesc || null, image_url: prodImage || null };
    try {
      if (editingProduct) {
        await supabase.from('mt_products').update(payload).eq('id', editingProduct.id);
        toast.success('Produto atualizado!');
      } else {
        const user = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user.data.user?.id || '').single();
        await supabase.from('mt_products').insert({ ...payload, company_id: profile?.company_id });
        toast.success('Produto criado!');
      }
      setProductDialog(false);
      loadProducts();
    } catch { /* error handled */ }
  };

  const deleteProduct = async (id: string) => {
    try {
      await supabase.from('mt_products').delete().eq('id', id);
      toast.success('Produto removido');
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
    try {
      const expr = formula.replace(/L/g, String(L)).replace(/H/g, String(H));
      if (!/^[\d\s+\-*/().]+$/.test(expr)) return '—';
      const result: unknown = Function(`"use strict"; return (${expr})`)();
      return `${Math.round(Number(result))} mm`;
    } catch {
      return 'Erro';
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return {
    products, profiles, search, setSearch, loading,
    selectedProduct, setSelectedProduct, cutRules, loadingRules, loadCutRules,
    productDialog, setProductDialog, editingProduct, prodName, setProdName, prodDesc, setProdDesc, prodImage, setProdImage,
    openNewProduct, openEditProduct, saveProduct, deleteProduct,
    ruleDialog, setRuleDialog, editingRule, ruleProfileId, setRuleProfileId, ruleFormula, setRuleFormula, ruleQty, setRuleQty, ruleAngle, setRuleAngle, ruleAxis, setRuleAxis,
    openNewRule, openEditRule, saveRule, deleteRule,
    previewL, setPreviewL, previewH, setPreviewH,
    evalFormula, filtered,
  };
}

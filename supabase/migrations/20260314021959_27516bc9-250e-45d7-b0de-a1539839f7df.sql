
-- =============================================
-- STEP 2: Drop old permissive policies and create company-scoped ones
-- =============================================

-- ---- CLIENTES ----
DROP POLICY IF EXISTS "Authenticated can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete clientes" ON public.clientes;

CREATE POLICY "Users can view company clientes" ON public.clientes FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can insert company clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Users can update company clientes" ON public.clientes FOR UPDATE TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Admins can delete company clientes" ON public.clientes FOR DELETE TO authenticated USING (company_id = get_user_company_id() AND has_role(auth.uid(), 'admin'));

-- ---- FORNECEDORES ----
DROP POLICY IF EXISTS "Authenticated can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated can manage fornecedores" ON public.fornecedores;

CREATE POLICY "Users can view company fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PEDIDOS ----
DROP POLICY IF EXISTS "Authenticated can view pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Authenticated can manage pedidos" ON public.pedidos;

CREATE POLICY "Users can view company pedidos" ON public.pedidos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company pedidos" ON public.pedidos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PEDIDO_ITENS ----
DROP POLICY IF EXISTS "Authenticated can view pedido_itens" ON public.pedido_itens;
DROP POLICY IF EXISTS "Authenticated can manage pedido_itens" ON public.pedido_itens;

CREATE POLICY "Users can view company pedido_itens" ON public.pedido_itens FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company pedido_itens" ON public.pedido_itens FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- ORCAMENTOS ----
DROP POLICY IF EXISTS "Authenticated can view orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Authenticated can manage orcamentos" ON public.orcamentos;

CREATE POLICY "Users can view company orcamentos" ON public.orcamentos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company orcamentos" ON public.orcamentos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- ORCAMENTO_ITENS ----
DROP POLICY IF EXISTS "Authenticated can view orcamento_itens" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Authenticated can manage orcamento_itens" ON public.orcamento_itens;

CREATE POLICY "Users can view company orcamento_itens" ON public.orcamento_itens FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company orcamento_itens" ON public.orcamento_itens FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- CONTAS_PAGAR ----
DROP POLICY IF EXISTS "Authenticated can view contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated can manage contas_pagar" ON public.contas_pagar;

CREATE POLICY "Users can view company contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- CONTAS_RECEBER ----
DROP POLICY IF EXISTS "Authenticated can view contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated can manage contas_receber" ON public.contas_receber;

CREATE POLICY "Users can view company contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PAGAMENTOS ----
DROP POLICY IF EXISTS "Authenticated can view pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Authenticated can manage pagamentos" ON public.pagamentos;

CREATE POLICY "Users can view company pagamentos" ON public.pagamentos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- NOTAS_FISCAIS ----
DROP POLICY IF EXISTS "Authenticated can view notas_fiscais" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Authenticated can manage notas_fiscais" ON public.notas_fiscais;

CREATE POLICY "Users can view company notas_fiscais" ON public.notas_fiscais FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company notas_fiscais" ON public.notas_fiscais FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- CONTRATOS ----
DROP POLICY IF EXISTS "Authenticated can view contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated can manage contratos" ON public.contratos;

CREATE POLICY "Users can view company contratos" ON public.contratos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company contratos" ON public.contratos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- SERVICOS ----
DROP POLICY IF EXISTS "Authenticated can view servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated can manage servicos" ON public.servicos;

CREATE POLICY "Users can view company servicos" ON public.servicos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company servicos" ON public.servicos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- SERVICO_CHECKLIST ----
DROP POLICY IF EXISTS "Authenticated can view servico_checklist" ON public.servico_checklist;
DROP POLICY IF EXISTS "Authenticated can manage servico_checklist" ON public.servico_checklist;

CREATE POLICY "Users can view company servico_checklist" ON public.servico_checklist FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company servico_checklist" ON public.servico_checklist FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- DOCUMENTOS ----
DROP POLICY IF EXISTS "Authenticated can view documentos" ON public.documentos;
DROP POLICY IF EXISTS "Authenticated can manage documentos" ON public.documentos;

CREATE POLICY "Users can view company documentos" ON public.documentos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company documentos" ON public.documentos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- AGENDA_EVENTOS ----
DROP POLICY IF EXISTS "Authenticated can view agenda_eventos" ON public.agenda_eventos;
DROP POLICY IF EXISTS "Authenticated can manage agenda_eventos" ON public.agenda_eventos;

CREATE POLICY "Users can view company agenda_eventos" ON public.agenda_eventos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company agenda_eventos" ON public.agenda_eventos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PRODUTOS ----
DROP POLICY IF EXISTS "Authenticated can view produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated can manage produtos" ON public.produtos;

CREATE POLICY "Users can view company produtos" ON public.produtos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company produtos" ON public.produtos FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PERFIS_ALUMINIO ----
DROP POLICY IF EXISTS "Authenticated can view perfis" ON public.perfis_aluminio;
DROP POLICY IF EXISTS "Authenticated can manage perfis" ON public.perfis_aluminio;

CREATE POLICY "Users can view company perfis" ON public.perfis_aluminio FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company perfis" ON public.perfis_aluminio FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PLANOS_DE_CORTE ----
DROP POLICY IF EXISTS "Authenticated can view planos" ON public.planos_de_corte;
DROP POLICY IF EXISTS "Authenticated can manage planos" ON public.planos_de_corte;

CREATE POLICY "Users can view company planos" ON public.planos_de_corte FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company planos" ON public.planos_de_corte FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- ORDER_PROGRESS ----
DROP POLICY IF EXISTS "Auth view order_progress" ON public.order_progress;
DROP POLICY IF EXISTS "Auth manage order_progress" ON public.order_progress;

CREATE POLICY "Users can view company order_progress" ON public.order_progress FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company order_progress" ON public.order_progress FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- FABRICANTES ----
DROP POLICY IF EXISTS "Auth view fabricantes" ON public.fabricantes;
DROP POLICY IF EXISTS "Auth manage fabricantes" ON public.fabricantes;

CREATE POLICY "Users can view company fabricantes" ON public.fabricantes FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company fabricantes" ON public.fabricantes FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- FERRAGENS ----
DROP POLICY IF EXISTS "Auth view ferragens" ON public.ferragens;
DROP POLICY IF EXISTS "Auth manage ferragens" ON public.ferragens;

CREATE POLICY "Users can view company ferragens" ON public.ferragens FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company ferragens" ON public.ferragens FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- LINHAS ----
DROP POLICY IF EXISTS "Auth view linhas" ON public.linhas;
DROP POLICY IF EXISTS "Auth manage linhas" ON public.linhas;

CREATE POLICY "Users can view company linhas" ON public.linhas FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company linhas" ON public.linhas FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- MODELOS_ESQUADRIA ----
DROP POLICY IF EXISTS "Auth view modelos_esquadria" ON public.modelos_esquadria;
DROP POLICY IF EXISTS "Auth manage modelos_esquadria" ON public.modelos_esquadria;

CREATE POLICY "Users can view company modelos_esquadria" ON public.modelos_esquadria FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company modelos_esquadria" ON public.modelos_esquadria FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- COMPONENTES_MODELO ----
DROP POLICY IF EXISTS "Auth view componentes_modelo" ON public.componentes_modelo;
DROP POLICY IF EXISTS "Auth manage componentes_modelo" ON public.componentes_modelo;

CREATE POLICY "Users can view company componentes_modelo" ON public.componentes_modelo FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company componentes_modelo" ON public.componentes_modelo FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- LISTA_CORTE ----
DROP POLICY IF EXISTS "Auth view lista_corte" ON public.lista_corte;
DROP POLICY IF EXISTS "Auth manage lista_corte" ON public.lista_corte;

CREATE POLICY "Users can view company lista_corte" ON public.lista_corte FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company lista_corte" ON public.lista_corte FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PROJETOS_ESQUADRIA ----
DROP POLICY IF EXISTS "Auth view projetos_esquadria" ON public.projetos_esquadria;
DROP POLICY IF EXISTS "Auth manage projetos_esquadria" ON public.projetos_esquadria;

CREATE POLICY "Users can view company projetos_esquadria" ON public.projetos_esquadria FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company projetos_esquadria" ON public.projetos_esquadria FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- PERFIS_CATALOGO ----
DROP POLICY IF EXISTS "Auth view perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Auth manage perfis_catalogo" ON public.perfis_catalogo;

CREATE POLICY "Users can view company perfis_catalogo" ON public.perfis_catalogo FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage company perfis_catalogo" ON public.perfis_catalogo FOR ALL TO authenticated USING (company_id = get_user_company_id()) WITH CHECK (company_id = get_user_company_id());

-- ---- CONFIG_PRECOS ----
DROP POLICY IF EXISTS "Auth view config_precos" ON public.config_precos;
DROP POLICY IF EXISTS "Admin manage config_precos" ON public.config_precos;

CREATE POLICY "Users can view company config_precos" ON public.config_precos FOR SELECT TO authenticated USING (company_id = get_user_company_id());
CREATE POLICY "Admins can manage company config_precos" ON public.config_precos FOR ALL TO authenticated USING (company_id = get_user_company_id() AND has_role(auth.uid(), 'admin')) WITH CHECK (company_id = get_user_company_id() AND has_role(auth.uid(), 'admin'));

-- ---- PROFILES (restrict to same company) ----
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Users can view company profiles" ON public.profiles FOR SELECT TO authenticated USING (company_id = get_user_company_id() OR user_id = auth.uid());

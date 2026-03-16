import { useState } from 'react';

export interface ItemFormState {
  descricao: string;
  quantidade: string;
  valor_unitario: string;
  largura: string;
  altura: string;
  produto_id: string;
}

const ITEM_FORM_VAZIO: ItemFormState = {
  descricao: '', quantidade: '1', valor_unitario: '', largura: '', altura: '', produto_id: '',
};

export function useOrcamentoState() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Smart configurator
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configOrcId, setConfigOrcId] = useState('');

  // Legacy simple item form
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemOrcId, setItemOrcId] = useState('');
  const [itemForm, setItemForm] = useState<ItemFormState>(ITEM_FORM_VAZIO);

  const openSmartAdd = (orcId: string) => {
    setConfigOrcId(orcId);
    setConfigDialogOpen(true);
  };

  const openAddItem = (orcId: string) => {
    setItemOrcId(orcId);
    setItemForm(ITEM_FORM_VAZIO);
    setItemDialogOpen(true);
  };

  const closeAddItem = () => {
    setItemDialogOpen(false);
    setItemForm(ITEM_FORM_VAZIO);
  };

  return {
    dialogOpen, setDialogOpen,
    configDialogOpen, setConfigDialogOpen, configOrcId,
    itemDialogOpen, itemOrcId, itemForm, setItemForm,
    openSmartAdd, openAddItem, closeAddItem,
  };
}

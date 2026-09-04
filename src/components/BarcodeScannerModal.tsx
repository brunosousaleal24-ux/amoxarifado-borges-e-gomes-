import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Barcode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Minus, 
  Plus,
  Sparkles,
  Zap
} from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectAction: (item: InventoryItem, action: 'SAIDA' | 'ENTRADA') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectAction,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setScannedItem(null);
      setScanSuccess(false);
      setErrorMessage(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScan = (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim();
    if (!cleanCode) return;

    const found = items.find(
      (it) => it.barcode === cleanCode || it.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setScannedItem(found);
      setScanSuccess(true);
      setErrorMessage(null);
    } else {
      setScannedItem(null);
      setScanSuccess(false);
      setErrorMessage(`Nenhum item com o código "${cleanCode}" foi localizado no almoxarifado.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(barcodeInput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Terminal de Leitura Óptica (Barcode / QR)</h3>
              <p className="text-[11px] text-slate-400">Compatível com leitores USB/Bluetooth ou bipagem manual</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Virtual Scanner Laser Screen HUD */}
          <div className="relative h-44 rounded-xl bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
            {/* Corner targets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

            {/* Red Laser Scan line */}
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce top-1/2 -translate-y-1/2" />

            <div className="z-10 text-center px-4">
              <Barcode className="w-12 h-12 text-slate-600 mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-semibold text-slate-300">
                Aponte o leitor de código de barras ou digite o código
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Suporta códigos EAN-13, Code 128 e etiquetas SKU
              </p>
            </div>
          </div>

          {/* Direct Code Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Entrada do Leitor / Código
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Bipe ou digite o código e pressione Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => handleScan(barcodeInput)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>
          </div>

          {/* Quick Click Samples to Test */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Clique em um código rápido para testar a bipagem:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setBarcodeInput(item.barcode);
                    handleScan(item.barcode);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded border border-slate-800 transition-colors flex items-center gap-1"
                >
                  <span className="text-amber-400 font-bold">{item.sku}</span>
                  <span className="text-slate-500">({item.barcode.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Result */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {scanSuccess && scannedItem && (
            <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3 shadow-md animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {scannedItem.sku}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Item Localizado
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1">{scannedItem.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{scannedItem.category}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Saldo Atual</span>
                  <span className="text-lg font-black text-white">{scannedItem.currentStock} {scannedItem.unit}</span>
                </div>
              </div>

              {/* Physical Location */}
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Endereço: <strong>Corredor {scannedItem.location.aisle}</strong> • Prateleira {scannedItem.location.shelf} • Box {scannedItem.location.bin}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onSelectAction(scannedItem, 'SAIDA');
                    onClose();
                  }}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                  Dar Baixa / Saída
                </button>
                <button
                  onClick={() => {
                    onSelectAction(scannedItem, 'ENTRADA');
                    onClose();
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Dar Entrada
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

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
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { InventoryItem } from '../types.ts';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectAction: (item: InventoryItem, action: 'SAIDA' | 'ENTRADA') => void;
  onQuickQuantityUpdate?: (item: InventoryItem, delta: number) => Promise<void>;
}

// Synthesize scanner beep using Web Audio API
function playScannerAudio(type: 'success' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1900, ctx.currentTime);
      osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectAction,
  onQuickQuantityUpdate,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [quickActionStatus, setQuickActionStatus] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize and clean up state on modal open/close
  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setScannedItem(null);
      setScanSuccess(false);
      setErrorMessage(null);
      setQuickActionStatus(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar câmera:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      // Ensure target element exists
      const readerElement = document.getElementById('qr-reader');
      if (!readerElement) return;

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ];

      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport,
        verbose: false
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 180 }
        },
        (decodedText) => {
          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            handleScan(decodedText);
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 1200);
          }
        },
        () => {
          // Frame without code, ignore
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Falha ao iniciar câmera:', err);
      setIsCameraActive(false);
      setErrorMessage('Não foi possível acessar a câmera de vídeo. Verifique as permissões do navegador ou utilize o leitor USB / código manual.');
    }
  };

  const handleScan = (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim().toLowerCase();
    if (!cleanCode) return;

    // Search in items list by barcode or SKU
    const found = items.find(
      (it) => it.barcode.toLowerCase() === cleanCode || it.sku.toLowerCase() === cleanCode
    );

    if (found) {
      setScannedItem(found);
      setScanSuccess(true);
      setErrorMessage(null);
      if (soundEnabled) playScannerAudio('success');

      // If continuous mode is on with auto-quick action
      setQuickActionStatus(`Item ${found.sku} identificado com sucesso!`);
    } else {
      setScannedItem(null);
      setScanSuccess(false);
      setErrorMessage(`Nenhum item com código "${codeToSearch.trim()}" encontrado no estoque.`);
      if (soundEnabled) playScannerAudio('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(barcodeInput);
    }
  };

  const handleQuickAdjust = async (delta: number) => {
    if (!scannedItem || !onQuickQuantityUpdate) return;
    try {
      await onQuickQuantityUpdate(scannedItem, delta);
      if (soundEnabled) playScannerAudio('success');
      setQuickActionStatus(`Saldo atualizado com sucesso (${delta > 0 ? `+${delta}` : delta} ${scannedItem.unit})!`);
      // Update local view
      setScannedItem({
        ...scannedItem,
        currentStock: scannedItem.currentStock + delta
      });
      setTimeout(() => setQuickActionStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Falha ao registrar ajuste rápido no banco de dados.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                Leitor Óptico & Scanner de Código
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ao Vivo
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Compatível com câmera do celular/laptop e leitores laser USB/Bluetooth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar bip sonoro' : 'Ativar bip sonoro'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Scanner Viewfinder / Camera Screen */}
          <div className="relative min-h-[190px] rounded-xl bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            
            {/* HTML5 QR Camera Element */}
            <div 
              id="qr-reader" 
              className={`w-full h-full overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`}
              style={{ minHeight: '220px' }}
            />

            {/* Virtual Standby Viewfinder when camera is inactive */}
            {!isCameraActive && (
              <div className="p-6 text-center space-y-3 z-10">
                {/* Corner targets */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-500" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-500" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-500" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-500" />

                {/* Laser line animation */}
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />

                <Barcode className="w-12 h-12 text-slate-600 mx-auto opacity-70" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Terminal Pronto para Bipagem
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                    Aponte o leitor de código de barras físico ou ative a câmera abaixo para escanear
                  </p>
                </div>
              </div>
            )}

            {/* Camera Toggle Button overlay */}
            <div className="absolute bottom-3 right-3 z-20">
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Desligar Câmera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ativar Leitura por Câmera</span>
                </button>
              )}
            </div>
          </div>

          {/* Direct Code Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Código de Barras / SKU / EAN-13
              </label>
              <span className="text-[10px] text-slate-400">
                Pressione Enter para bipar
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Bipe com o leitor ou digite o código..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => handleScan(barcodeInput)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
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
              <span>Simular bipagem rápida de itens do estoque:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setBarcodeInput(item.barcode);
                    handleScan(item.barcode);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-md border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-amber-400 font-bold">{item.sku}</span>
                  <span className="text-slate-500 text-[10px]">({item.barcode.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Action Success Notification */}
          {quickActionStatus && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{quickActionStatus}</span>
            </div>
          )}

          {/* Scanned Item Found Details Card */}
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
                  <p className="text-xs text-slate-400 mt-0.5">{scannedItem.category} • EAN: {scannedItem.barcode}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Saldo em Estoque</span>
                  <span className="text-lg font-black text-white">{scannedItem.currentStock} {scannedItem.unit}</span>
                </div>
              </div>

              {/* Physical Location */}
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Corredor <strong>{scannedItem.location.aisle}</strong> • Prat. <strong>{scannedItem.location.shelf}</strong> • Box <strong>{scannedItem.location.bin}</strong>
                  </span>
                </div>
                <div className="text-slate-400 font-mono">
                  Custo: R$ {scannedItem.unitCost.toFixed(2)}
                </div>
              </div>

              {/* Quick Actions Bar (+1 / -1 on the fly) */}
              {onQuickQuantityUpdate && (
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Ajuste Imediato:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(-1)}
                      className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold border border-rose-700/50 flex items-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                      -1 {scannedItem.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(1)}
                      className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-700/50 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      +1 {scannedItem.unit}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Detailed Movement Modal */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onSelectAction(scannedItem, 'SAIDA');
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                  Dar Baixa / Saída Completa
                </button>
                <button
                  onClick={() => {
                    onSelectAction(scannedItem, 'ENTRADA');
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Entrada / NF
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

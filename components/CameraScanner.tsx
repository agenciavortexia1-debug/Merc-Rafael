
import React, { useEffect, useRef, useState } from 'react';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isBatch?: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose, isBatch = false }) => {
  const [status, setStatus] = useState('Iniciando câmera...');
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scannerInstance = useRef<any>(null);
  const lockRef = useRef<boolean>(false);

  const startScanner = () => {
    // @ts-ignore
    const Html5Qrcode = window.Html5Qrcode;
    if (!Html5Qrcode) return;

    const html5QrCode = new Html5Qrcode("reader");
    scannerInstance.current = html5QrCode;

    const config = { 
      fps: 15, // Aumentado para resposta mais rápida
      qrbox: { width: 280, height: 150 },
      aspectRatio: 1.0,
      disableFlip: true
    };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText: string) => {
        // Trava de segurança para evitar múltiplos bipes do mesmo frame
        if (lockRef.current) return;
        lockRef.current = true;
        
        // Em vez de apenas pausar, sinalizamos o estado
        setIsPaused(true);
        setLastCode(decodedText);
        setStatus(`CAPTURADO: ${decodedText}`);
        
        // Feedback tátil e envio do código
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(decodedText);

        // No modo venda (não-lote), fecha automático após sucesso
        if (!isBatch) {
          setTimeout(() => {
            if (scannerInstance.current) {
              scannerInstance.current.stop().then(() => onClose()).catch(() => onClose());
            }
          }, 600);
        }
      },
      () => {} 
    ).then(() => {
      setStatus("Aponte para o código");
    }).catch((err: any) => {
      console.error("Erro ao iniciar scanner:", err);
      onClose();
    });
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload = startScanner;
    document.body.appendChild(script);
    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current.stop().catch(() => {});
      }
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handleNextItem = () => {
    // Reset de trava e estado para permitir nova leitura
    setLastCode(null);
    setIsPaused(false);
    setStatus("Aguardando próximo...");
    
    // Pequeno delay para o usuário afastar o produto antes de liberar o sensor
    setTimeout(() => {
      lockRef.current = false;
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-between">
      {/* Header Fixo */}
      <div className="w-full p-6 flex justify-between items-center bg-black/80 z-[1010]">
        <button onClick={onClose} className="p-3 bg-white/20 text-white rounded-2xl active:scale-90 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPaused ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-blue-600'} text-white transition-all`}>
          {status}
        </div>
        <div className="w-12"></div>
      </div>

      {/* Container da Câmera */}
      <div id="reader" className="absolute inset-0 w-full h-full"></div>

      {/* Overlay de Foco Central */}
      {!isPaused && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] max-w-[400px] h-[180px] border-4 border-blue-500 rounded-[2rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.7)] relative">
            <div className="absolute inset-x-0 h-1 bg-blue-400/50 blur-sm animate-[scan_2s_infinite]"></div>
          </div>
        </div>
      )}

      {/* Painel de Controle Pós-Leitura */}
      {isPaused && (
        <div className="w-full p-8 bg-slate-900 rounded-t-[3rem] z-[1020] space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-slate-800">
          <div className="text-center">
            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Item Registrado</p>
            <p className="text-white font-mono text-2xl font-bold tracking-tight">{lastCode}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleNextItem}
              className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              PRÓXIMO ITEM
            </button>
            
            {isBatch && (
              <button 
                onClick={onClose}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-3 opacity-80"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                FINALIZAR AGORA
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0%, 100% { top: 10%; } 50% { top: 90%; } }
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
};

export default CameraScanner;

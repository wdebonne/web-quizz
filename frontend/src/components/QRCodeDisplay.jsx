import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ value, size = 200, label, code }) {
  if (!value) return null;

  const download = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg shadow-brand-500/20">
        <QRCodeSVG id="qr-svg" value={value} size={size} level="M"
          fgColor="#1e1b4b" bgColor="#ffffff" />
      </div>
      {code && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">{label || 'Code de la partie'}</p>
          <div className="bg-gray-800 border-2 border-brand-500/50 rounded-2xl px-6 py-3">
            <span className="font-display font-bold text-3xl tracking-widest text-brand-400 select-all">
              {code}
            </span>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={download} className="btn-secondary btn-sm">
          💾 Télécharger QR
        </button>
        <button onClick={() => navigator.clipboard?.writeText(value)} className="btn-secondary btn-sm">
          📋 Copier le lien
        </button>
      </div>
    </div>
  );
}

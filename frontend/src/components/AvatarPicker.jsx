import { useState, useRef } from 'react';
import api from '../api';

export const DICEBEAR_STYLE = 'adventurer';
export const getDiceBearUrl = (seed) =>
  `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;

const DEFAULT_AVATARS = [
  'dicebear:fox', 'dicebear:wolf', 'dicebear:lion', 'dicebear:tiger', 'dicebear:bear', 'dicebear:raccoon',
  'dicebear:unicorn', 'dicebear:frog', 'dicebear:butterfly', 'dicebear:dragon', 'dicebear:eagle', 'dicebear:peacock',
  'dicebear:cosmos', 'dicebear:rocket', 'dicebear:star', 'dicebear:moon', 'dicebear:phoenix', 'dicebear:diamond',
  'dicebear:trophy', 'dicebear:bolt', 'dicebear:wave', 'dicebear:clover', 'dicebear:bullseye', 'dicebear:guitar',
  'dicebear:shark', 'dicebear:croc', 'dicebear:raptor', 'dicebear:robot', 'dicebear:alien', 'dicebear:jester',
];

export const AvatarDisplay = ({ avatar, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-24 h-24' };
  if (!avatar) return <div className={`${sizes[size]} rounded-full bg-gray-800 ${className}`} />;

  if (avatar.startsWith('dicebear:')) {
    const seed = avatar.slice(9);
    return <img src={getDiceBearUrl(seed)} alt={seed} className={`${sizes[size]} rounded-full bg-gray-800 ${className}`} />;
  }
  if (avatar.startsWith('/uploads/') || avatar.startsWith('http')) {
    return <img src={avatar} alt="avatar" className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }
  // Legacy emoji fallback
  if (avatar.startsWith('emoji:')) {
    const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl', xl: 'text-5xl' };
    return (
      <div className={`${sizes[size]} rounded-full bg-gray-800 flex items-center justify-center ${textSizes[size]} ${className}`}>
        {avatar.slice(6)}
      </div>
    );
  }
  return <div className={`${sizes[size]} rounded-full bg-gray-800 ${className}`} />;
};

export default function AvatarPicker({ value, onChange, allowUpload = true }) {
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('default');
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/uploads/avatar', form);
      onChange(data.url);
      setTab('custom');
    } catch {
      alert('Erreur lors du téléchargement.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center gap-4">
        <AvatarDisplay avatar={value} size="xl" />
        <p className="text-sm text-gray-400">Avatar sélectionné</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('default')}
          className={`btn-sm ${tab === 'default' ? 'btn-primary' : 'btn-secondary'}`}>
          Avatars
        </button>
        {allowUpload && (
          <button onClick={() => setTab('upload')}
            className={`btn-sm ${tab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}>
            Importer
          </button>
        )}
      </div>

      {tab === 'default' && (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {DEFAULT_AVATARS.map(av => (
            <button key={av} onClick={() => onChange(av)}
              className={`aspect-square rounded-xl p-1 flex items-center justify-center transition-all
                ${value === av ? 'bg-brand-500/30 ring-2 ring-brand-500 scale-110' : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'}`}>
              <img src={getDiceBearUrl(av.slice(9))} alt={av.slice(9)} className="w-full h-full rounded-lg" />
            </button>
          ))}
        </div>
      )}

      {tab === 'upload' && allowUpload && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Importez votre propre image (JPG, PNG, GIF, max 5MB). Elle sera soumise à l'approbation du créateur.</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="btn-secondary btn w-full">
            {uploading ? 'Téléchargement...' : 'Choisir une image'}
          </button>
          {value?.startsWith('/uploads/') && (
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
              <AvatarDisplay avatar={value} size="md" />
              <span className="text-sm text-gray-300">Image personnalisée</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

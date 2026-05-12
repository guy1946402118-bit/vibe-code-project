import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';

const PRESET_AVATARS = [
  '🌱', '🌿', '🌸', '🌻', '🌹', '🌺', '🍀', '🎯', '💎', '⭐',
  '🔥', '⚡', '💫', '🌙', '☀️', '🌈', '🎨', '🎭', '🎪', '🎬',
  '🐱', '🐶', '🦊', '🐼', '🦁', '🐯', '🦄', '🐲', '🦋', '🌊',
  '🚀', '✈️', '🎸', '🎹', '🎧', '📚', '💻', '📱', '⌚', '🔑',
];

interface AvatarEditorProps {
  onClose: () => void;
}

export function AvatarEditor({ onClose }: AvatarEditorProps) {
  const { currentUser, updateUser } = useUserStore();
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const avatar = customImage || selectedAvatar;
    if (currentUser && avatar) {
      updateUser(currentUser.id, { avatar });
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
          👤 选择头像
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            overflow: 'hidden',
          }}>
            {customImage ? (
              <img src={customImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : selectedAvatar ? (
              selectedAvatar
            ) : (
              currentUser?.name.charAt(0)
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📤 上传自定义头像
          </motion.button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#666' }}>
            或选择预设头像
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {PRESET_AVATARS.map((avatar, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAvatar(avatar);
                  setCustomImage(null);
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: selectedAvatar === avatar && !customImage ? '2px solid #667eea' : '1px solid #eee',
                  background: selectedAvatar === avatar && !customImage ? '#667eea15' : '#f9f9f9',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            取消
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            💾 保存
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
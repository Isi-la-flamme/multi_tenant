// src/components/features/user/components/ProfileAvatar.tsx
'use client';

import { useState, useRef } from 'react';
import { User, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUploadAvatar } from '../hooks/useUser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  avatar?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

const iconSizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function ProfileAvatar({
  avatar,
  name,
  className,
  size = 'lg',
}: ProfileAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadAvatar.mutate(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className={cn('cursor-pointer', sizeClasses[size])}>
        <AvatarImage src={previewUrl || avatar || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <span className={cn('font-semibold', {
            'text-lg': size === 'sm',
            'text-xl': size === 'md',
            'text-2xl': size === 'lg',
            'text-3xl': size === 'xl',
          })}>
            {initials}
          </span>
        </AvatarFallback>
      </Avatar>

      {/* Overlay au survol */}
      {isHovered && (
        <div
          className={cn(
            'absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 transition-opacity',
            sizeClasses[size]
          )}
          onClick={handleClick}
        >
          <Camera className={cn('text-white', iconSizeClasses[size])} />
        </div>
      )}

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
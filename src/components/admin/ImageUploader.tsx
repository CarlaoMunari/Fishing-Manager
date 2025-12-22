import React, { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
    bucket: string;
    onUploadComplete: (url: string) => void;
    maxSizeMB?: number;
    allowedTypes?: string[];
    recommendedSize?: { width: number; height: number };
    label?: string;
}

export function ImageUploader({
    bucket,
    onUploadComplete,
    maxSizeMB = 5,
    allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    recommendedSize,
    label = 'Selecionar Imagem'
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccess(false);

        // Validar tipo
        if (!allowedTypes.includes(file.type)) {
            setError(`Tipo não permitido. Use: ${allowedTypes.join(', ')}`);
            return;
        }

        // Validar tamanho
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > maxSizeMB) {
            setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Obter URL pública
            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

            setSuccess(true);
            onUploadComplete(data.publicUrl);

            // Limpar preview após 2 segundos
            setTimeout(() => {
                setPreview(null);
                setSuccess(false);
            }, 2000);

        } catch (err: any) {
            console.error('Erro no upload:', err);
            setError(err.message || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-ocean-400 transition-colors">
                <input
                    type="file"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`file-upload-${bucket}`}
                    disabled={uploading}
                />

                <label
                    htmlFor={`file-upload-${bucket}`}
                    className="cursor-pointer flex flex-col items-center space-y-2"
                >
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {recommendedSize && (
                        <span className="text-xs text-gray-500">
                            Recomendado: {recommendedSize.width}x{recommendedSize.height}px
                        </span>
                    )}
                    <span className="text-xs text-gray-500">
                        Máximo: {maxSizeMB}MB
                    </span>
                </label>
            </div>

            {preview && (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain bg-gray-100 rounded-lg"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-white text-sm font-medium">Enviando...</div>
                        </div>
                    )}
                    {success && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                            <Check className="w-12 h-12 text-white" />
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                    <X className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}

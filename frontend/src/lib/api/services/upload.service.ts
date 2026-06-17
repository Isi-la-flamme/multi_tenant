import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface UploadFile {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export const uploadService = {
  uploadFile: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const { data } = await apiClient.post<UploadFile>(
      API_ENDPOINTS.UPLOAD.UPLOAD_FILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  uploadMultiple: async (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const { data } = await apiClient.post<UploadFile[]>(
      API_ENDPOINTS.UPLOAD.UPLOAD_MULTIPLE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  getFileUrl: (filename: string) => {
    return `${process.env.NEXT_PUBLIC_UPLOAD_URL}/${filename}`;
  },
};
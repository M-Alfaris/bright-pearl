import React, { useState } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { supabaseClient } from "../../utility";

const { Dragger } = Upload;

interface ScreenshotUploadProps {
  reportId?: string;
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
}

export const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({
  reportId,
  maxFiles = 5,
  onUploadComplete,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = reportId ? `${reportId}/${fileName}` : `temp/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('screenshots')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleUpload = async () => {
    setUploading(true);

    try {
      const uploadPromises = fileList.map((file) => {
        if (file.originFileObj) {
          return uploadToSupabase(file.originFileObj);
        }
        return Promise.resolve('');
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== '');

      message.success(`Successfully uploaded ${validUrls.length} screenshot(s)`);

      if (onUploadComplete) {
        onUploadComplete(validUrls);
      }

      setFileList([]);
    } catch (error) {
      message.error('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return false;
      }

      // Check max files
      if (fileList.length >= maxFiles) {
        message.error(`You can only upload up to ${maxFiles} screenshots`);
        return false;
      }

      setFileList([...fileList, file as any]);
      return false; // Prevent auto upload
    },
    fileList,
    accept: 'image/*',
    multiple: true,
  };

  return (
    <div>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag screenshots to upload</p>
        <p className="ant-upload-hint">
          Support for images only. Maximum {maxFiles} files, 5MB each.
        </p>
      </Dragger>
      {fileList.length > 0 && (
        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          style={{ marginTop: 16 }}
          icon={<UploadOutlined />}
        >
          {uploading ? 'Uploading' : `Upload ${fileList.length} Screenshot(s)`}
        </Button>
      )}
    </div>
  );
};

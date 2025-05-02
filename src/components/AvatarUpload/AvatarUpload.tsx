// filepath: d:\大学资料\论文毕设\毕设\campus-forward-desktop\src\components\AvatarUpload\AvatarUpload.tsx
import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import Avatar from '@/components/Avatar/Avatar'; // Your existing Avatar component
import Button from '@/components/Button/Button';
import './AvatarUpload.css'; // Create this CSS file

interface AvatarUploadProps {
  currentAvatar: string | null; // URL of the current avatar
  onChange: (file: File | null, previewUrl: string | null) => void; // Callback with File object and preview URL
  label?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onChange, label = "选择头像" }) => {
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview if currentAvatar prop changes externally
  React.useEffect(() => {
      setPreview(currentAvatar);
  }, [currentAvatar]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic type check (can be more robust)
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件 (jpg, png, gif等)');
        // Clear the input value in case the user selects the same invalid file again
         if(fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      // Basic size check (e.g., 2MB)
      if (file.size > 2 * 1024 * 1024) {
         alert('图片大小不能超过 2MB');
         if(fileInputRef.current) fileInputRef.current.value = '';
         return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(file, result); // Pass file and preview URL up
      };
      reader.readAsDataURL(file);
    } else {
      // No file selected or selection cancelled
      // Optionally revert preview or keep the last valid one
      // setPreview(currentAvatar); // Revert to original if needed
      onChange(null, preview); // Pass null file
    }
  }, [onChange, preview]); // Include preview in deps if reverting

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // Trigger hidden file input
  };

  return (
    <div className="avatar-upload-group">
      {label && <label className="avatar-upload-label">{label}</label>}
      <div className="avatar-upload-controls">
         <Avatar src={preview || undefined} size="80px" /> {/* Show preview or current */}
         <input
           type="file"
           ref={fileInputRef}
           onChange={handleFileChange}
           accept="image/png, image/jpeg, image/gif" // Specify accepted types
           style={{ display: 'none' }} // Hide the default input
         />
         <Button type="button" onClick={handleButtonClick} theme="primary">
           选择文件
         </Button>
      </div>
    </div>
  );
};

export default AvatarUpload;
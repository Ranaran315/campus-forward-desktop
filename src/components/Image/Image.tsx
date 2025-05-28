import React from 'react';
import { Image as AntImage } from 'antd';
import { getImageUrl } from '@/utils/imageHelper';
import { ImageProps as AntImageProps } from 'antd';

interface ImageProps extends Omit<AntImageProps, 'src'> {
  src?: string | null;
  fallback?: string;
}

/**
 * 通用图片组件，自动处理URL前缀
 */
const Image: React.FC<ImageProps> = ({
  src,
  fallback = '/assets/images/image-error.png',
  ...rest
}) => {
  return (
    <AntImage
      src={src ? getImageUrl(src) : undefined}
      fallback={fallback}
      {...rest}
    />
  );
};

export default Image;
import ai from '@/assets/fileIcon/ai.png';
import apk from '@/assets/fileIcon/apk.png';
import audio from '@/assets/fileIcon/audio.png';
import code from '@/assets/fileIcon/code.png';
import dmg from '@/assets/fileIcon/dmg.png';
import doc from '@/assets/fileIcon/doc.png';
import exe from '@/assets/fileIcon/exe.png';
import folder from '@/assets/fileIcon/folder.png';
import font from '@/assets/fileIcon/font.png';
import image from '@/assets/fileIcon/image.png';
import ipa from '@/assets/fileIcon/ipa.png';
import keynote from '@/assets/fileIcon/keynote.png';
import link from '@/assets/fileIcon/link.png';
import mindmap from '@/assets/fileIcon/mindmap.png';
import note from '@/assets/fileIcon/note.png';
import numbers from '@/assets/fileIcon/numbers.png';
import pages from '@/assets/fileIcon/pages.png';
import pdf from '@/assets/fileIcon/pdf.png';
import pkg from '@/assets/fileIcon/pkg.png';
import ppt from '@/assets/fileIcon/ppt.png';
import ps from '@/assets/fileIcon/ps.png';
import rar from '@/assets/fileIcon/rar.png';
import sketch from '@/assets/fileIcon/sketch.png';
import txt from '@/assets/fileIcon/txt.png';
import unknown from '@/assets/fileIcon/unknown.png';
import video from '@/assets/fileIcon/video.png';
import xls from '@/assets/fileIcon/xls.png';
import zip from '@/assets/fileIcon/zip.png';

export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const iconMap: { [key: string]: string } = {
    // Documents
    'pdf': pdf,
    'doc': doc,
    'docx': doc,
    'txt': txt,
    'pages': pages,
    'numbers': numbers,
    'xls': xls,
    'xlsx': xls,
    'ppt': ppt,
    'pptx': ppt,
    
    // Archives
    'zip': zip,
    'rar': rar,
    '7z': zip,
    
    // Media
    'mp3': audio,
    'wav': audio,
    'ogg': audio,
    'mp4': video,
    'mov': video,
    'avi': video,
    'webm': video,
    
    // Images
    'jpg': image,
    'jpeg': image,
    'png': image,
    'gif': image,
    'webp': image,
    'svg': image,
    
    // Design
    'ai': ai,
    'psd': ps,
    'sketch': sketch,
    
    // Development
    'js': code,
    'ts': code,
    'jsx': code,
    'tsx': code,
    'html': code,
    'css': code,
    'json': code,
    'py': code,
    'java': code,
    
    // Executables
    'exe': exe,
    'dmg': dmg,
    'pkg': pkg,
    'apk': apk,
    'ipa': ipa,
    
    // Others
    'ttf': font,
    'otf': font,
    'woff': font,
    'woff2': font,
    'xmind': mindmap,
    'md': note,
    'url': link,
  };

  return iconMap[extension] || unknown;
} 
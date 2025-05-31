interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: 'select-folder'): Promise<Electron.OpenDialogReturnValue>;
    invoke(channel: 'download-file', args: { url: string; fileName: string }): Promise<{ success: boolean; filePath: string }>;
    invoke(channel: 'get-store-value', key: string): Promise<any>;
    invoke(channel: 'set-store-value', key: string, value: any): Promise<boolean>;
    invoke(channel: 'save-file', args: { 
      url: string; 
      fileName: string; 
      saveType: 'default' | 'saveAs';
      fileType: 'file' | 'image' | 'text'
    }): Promise<{ success: boolean; error?: string }>;
    invoke(channel: 'open-file', args: { 
      filePath: string 
    }): Promise<{ success: boolean; error?: string }>;
    invoke(channel: 'show-in-folder', args: { 
      filePath: string 
    }): Promise<{ success: boolean; error?: string }>;
    invoke(channel: 'get-downloads-path'): Promise<string>;
    invoke(channel: 'ensure-dir', dirPath: string): Promise<boolean>;
  };
}

declare interface Window {
  electron: ElectronAPI;
} 
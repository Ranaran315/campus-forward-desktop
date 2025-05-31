interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: 'select-folder'): Promise<Electron.OpenDialogReturnValue>;
    invoke(channel: 'download-file', args: { url: string; fileName: string }): Promise<{ success: boolean; filePath: string }>;
    invoke(channel: 'get-store-value', key: string): Promise<any>;
    invoke(channel: 'set-store-value', key: string, value: any): Promise<boolean>;
  };
}

declare interface Window {
  electron: ElectronAPI;
} 
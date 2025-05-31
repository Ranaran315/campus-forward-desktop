import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import './Setting.css';

const Setting: React.FC = () => {
  const [downloadPath, setDownloadPath] = useState<string>('');

  // 从 store 获取保存的路径
  const getStoredPath = async () => {
    try {
      const savedPath = await window.electron.ipcRenderer.invoke('get-store-value', 'downloadPath');
      if (savedPath) {
        setDownloadPath(savedPath);
      }
    } catch (error) {
      console.error('获取保存的下载路径失败:', error);
    }
  };

  // 保存路径到 store
  const savePathToStore = async (path: string) => {
    try {
      await window.electron.ipcRenderer.invoke('set-store-value', 'downloadPath', path);
      return true;
    } catch (error) {
      console.error('保存下载路径失败:', error);
      return false;
    }
  };

  useEffect(() => {
    getStoredPath();
  }, []);

  const handleSelectFolder = async () => {
    try {
      const { canceled, filePaths } = await window.electron.ipcRenderer.invoke('select-folder');
      
      if (!canceled && filePaths.length > 0) {
        const selectedPath = filePaths[0];
        const saved = await savePathToStore(selectedPath);
        
        if (saved) {
          setDownloadPath(selectedPath);
          message.success('下载路径设置成功');
        } else {
          message.error('保存下载路径失败');
        }
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
      message.error('选择文件夹失败');
    }
  };

  return (
    <div className="settings-container">
      <Form layout="vertical">
        <Form.Item
          label="文件下载路径"
          extra="选择文件下载保存的位置"
        >
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 120px)' }}
              value={downloadPath}
              placeholder="请选择下载路径"
              readOnly
            />
            <Button
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={handleSelectFolder}
              style={{ width: '120px' }}
            >
              选择文件夹
            </Button>
          </Input.Group>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Setting;

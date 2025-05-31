import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import './Setting.css';

const Setting: React.FC = () => {
  const [filePath, setFilePath] = useState<string>('');
  const [imagePath, setImagePath] = useState<string>('');

  // 从 store 获取保存的路径
  const getStoredPaths = async () => {
    try {
      const savedFilePath = await window.electron.ipcRenderer.invoke('get-store-value', 'filePath');
      const savedImagePath = await window.electron.ipcRenderer.invoke('get-store-value', 'imagePath');
      
      if (savedFilePath) {
        setFilePath(savedFilePath);
      }
      if (savedImagePath) {
        setImagePath(savedImagePath);
      }
    } catch (error) {
      console.error('获取保存的路径失败:', error);
    }
  };

  // 保存路径到 store
  const savePathToStore = async (key: string, path: string) => {
    try {
      await window.electron.ipcRenderer.invoke('set-store-value', key, path);
      return true;
    } catch (error) {
      console.error('保存路径失败:', error);
      return false;
    }
  };

  useEffect(() => {
    getStoredPaths();
  }, []);

  const handleSelectFolder = async (type: 'file' | 'image') => {
    try {
      const { canceled, filePaths } = await window.electron.ipcRenderer.invoke('select-folder');
      
      if (!canceled && filePaths.length > 0) {
        const selectedPath = filePaths[0];
        const key = type === 'file' ? 'filePath' : 'imagePath';
        const saved = await savePathToStore(key, selectedPath);
        
        if (saved) {
          if (type === 'file') {
            setFilePath(selectedPath);
          } else {
            setImagePath(selectedPath);
          }
          message.success(`${type === 'file' ? '文件' : '图片'}保存路径设置成功`);
        } else {
          message.error('保存路径失败');
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
          label="文件保存路径"
          extra="选择文件保存的位置"
        >
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 120px)' }}
              value={filePath}
              placeholder="请选择文件保存路径"
              readOnly
            />
            <Button
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={() => handleSelectFolder('file')}
              style={{ width: '120px' }}
            >
              选择文件夹
            </Button>
          </Input.Group>
        </Form.Item>

        <Form.Item
          label="图片保存路径"
          extra="选择图片保存的位置"
        >
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 120px)' }}
              value={imagePath}
              placeholder="请选择图片保存路径"
              readOnly
            />
            <Button
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={() => handleSelectFolder('image')}
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

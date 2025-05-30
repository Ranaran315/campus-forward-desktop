import React, { useEffect, useRef } from 'react';
import './ContextMenu.css'; // We'll add some basic CSS

export interface ContextMenuItem {
    icon?: React.ReactNode;
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    isSeparator?: boolean;
    customClassName?: string;
}

interface ContextMenuProps {
    x: number;
    y: number;
    visible: boolean;
    items: ContextMenuItem[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('contextmenu', onClose, true); // Close on another right-click
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('contextmenu', onClose, true);
        };
    }, [visible, onClose]);

    if (!visible) {
        return null;
    }

    return (
        <div
            ref={menuRef}
            className="custom-context-menu"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from closing it immediately if not on an item
        >
            <ul>
                {items.map((item, index) => {
                    if (item.isSeparator) {
                        return <li key={`separator-${index}`} className="context-menu-separator"></li>;
                    }
                    return (
                        <li
                            key={item.label || `item-${index}`}
                            className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${item.customClassName || ''}`.trim()}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.onClick?.();
                                    onClose(); // Close menu after action
                                }
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ContextMenu;
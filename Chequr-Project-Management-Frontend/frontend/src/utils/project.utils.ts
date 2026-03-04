import { Folder, Layout, Server, Database, Globe, Smartphone, Monitor } from 'lucide-react';

export const getProjectIcon = (iconName: string | null) => {
    switch (iconName) {
        case 'Folder': return Folder;
        case 'Layout': return Layout;
        case 'Server': return Server;
        case 'Database': return Database;
        case 'Globe': return Globe;
        case 'Smartphone': return Smartphone;
        case 'Monitor': return Monitor;
        default: return Folder;
    }
};

export const getProjectColor = (color: string | null): 'indigo' | 'purple' | 'green' | 'orange' => {
    switch (color) {
        case 'indigo': return 'indigo';
        case 'purple': return 'purple';
        case 'green': return 'green';
        case 'orange': return 'orange';
        default: return 'indigo';
    }
};

export const getProjectTagType = (type: string | null): 'WEB' | 'MOB' | 'API' | 'DES' => {
    switch (type) {
        case 'WEB': return 'WEB';
        case 'MOB': return 'MOB';
        case 'API': return 'API';
        case 'DES': return 'DES';
        default: return 'WEB';
    }
};

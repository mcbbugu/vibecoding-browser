import React from 'react';
import { Smartphone, Monitor, Laptop } from 'lucide-react';

export const DeviceSelector = ({ selectedDevice, onSelectDevice }) => {
  const devices = [
    { name: 'iPhone SE', width: '375px', height: '667px', category: 'mobile', icon: Smartphone, size: 16 },
    { name: 'iPhone 14 Pro Max', width: '430px', height: '932px', category: 'mobile', icon: Smartphone, size: 18 },
    { name: 'iPad', width: '768px', height: '1024px', category: 'tablet', icon: Monitor, size: 18 },
    { name: '桌面端', width: '100%', height: '100%', category: 'desktop', icon: Laptop, size: 18 },
  ];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
      {devices.map((device) => {
        const Icon = device.icon;
        const isSelected = selectedDevice.name === device.name;
        return (
          <button
            key={device.name}
            onClick={() => onSelectDevice(device)}
            className={`p-1.5 rounded transition-colors ${
              isSelected 
                ? 'bg-indigo-500 text-white' 
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
            title={device.name}
          >
            <Icon size={device.size} />
          </button>
        );
      })}
    </div>
  );
};


/// <reference types="vite/client" />

declare module '@headlessui/react' {
  export const Dialog: any;
  export const Transition: any;
}



declare module '*.svg?react' {
  import React from 'react';
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

declare module '*.png' {
  const pngContent: string;
  export default pngContent;
}

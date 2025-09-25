// src/types/custom-elements.d.ts
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'radix-connect-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
export {};

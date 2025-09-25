// src/types/radix-connect-button.d.ts
import 'react/jsx-runtime';
import type { HTMLAttributes, DetailedHTMLProps } from 'react';

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'radix-connect-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import FloatingAI from './FloatingAI';

function wrap(ui) {
  return <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>;
}

describe('FloatingAI', () => {
  it('renders the floating action button', () => {
    render(wrap(<FloatingAI role="patient" />));
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

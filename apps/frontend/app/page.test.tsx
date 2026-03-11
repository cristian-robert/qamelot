import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders the app name', () => {
    render(<Home />);
    expect(screen.getByText(/qamelot/i)).toBeInTheDocument();
  });
});

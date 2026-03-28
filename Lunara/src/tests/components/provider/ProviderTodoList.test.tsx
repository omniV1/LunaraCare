import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProviderTodoList } from '../../../components/provider/ProviderTodoList';

describe('ProviderTodoList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds, toggles, and removes todos (persists to localStorage)', () => {
    render(<ProviderTodoList />);
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add a task...'), { target: { value: 'Task 1' } });
    fireEvent.change(screen.getByDisplayValue('Mid'), { target: { value: 'HIGH' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(localStorage.getItem('lunara_provider_todos')).toContain('Task 1');

    // Toggle complete (first checkbox-like button)
    const li = screen.getByText('Task 1').closest('li')!;
    const toggleBtn = li.querySelector('button') as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    const saved = JSON.parse(localStorage.getItem('lunara_provider_todos') ?? '[]');
    expect(saved[0].completed).toBe(true);

    // Remove (trash icon button at end of row)
    const removeBtn = li.querySelectorAll('button')[1] as HTMLButtonElement;
    fireEvent.click(removeBtn);
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
  });

  it('loads saved todos from localStorage', () => {
    localStorage.setItem(
      'lunara_provider_todos',
      JSON.stringify([{ id: '1', text: 'Saved', priority: 'LOW', completed: false, createdAt: new Date().toISOString() }]),
    );
    render(<ProviderTodoList />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});


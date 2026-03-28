import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-quill-new', () => ({
  __esModule: true,
  default: React.forwardRef<
    HTMLTextAreaElement,
    {
      value?: string;
      placeholder?: string;
      style?: React.CSSProperties;
      onChange?: (value: string) => void;
    }
  >((props, _ref) => (
    <textarea
      data-testid="quill"
      value={props.value}
      placeholder={props.placeholder}
      style={props.style}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  )),
}));

import { RichTextEditor } from '../../../components/ui/RichTextEditor';

describe('RichTextEditor', () => {
  it('renders with value/placeholder and calls onChange', () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="hello" onChange={onChange} placeholder="Write here" height={123} />);

    const el = screen.getByTestId('quill') as HTMLTextAreaElement;
    expect(el).toHaveValue('hello');
    expect(el).toHaveAttribute('placeholder', 'Write here');
    expect(el.style.height).toBe('123px');

    fireEvent.change(el, { target: { value: 'next' } });
    expect(onChange).toHaveBeenCalledWith('next');
  });
});


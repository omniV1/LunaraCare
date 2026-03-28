import { render } from '@testing-library/react';
import { Spinner } from '../../components/ui/Spinner';

describe('Spinner', () => {
  it('should render with default size', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('should render with custom size', () => {
    const { container } = render(<Spinner size={64} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('should have correct CSS classes for animation', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('animate-spin');
    expect(svg).toHaveClass('text-gray-600');
  });

  it('should render circle and path elements', () => {
    const { container } = render(<Spinner />);
    const circle = container.querySelector('circle');
    const path = container.querySelector('path');

    expect(circle).toBeInTheDocument();
    expect(path).toBeInTheDocument();
  });
});

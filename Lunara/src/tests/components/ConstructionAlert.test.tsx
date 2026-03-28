import { render, screen, fireEvent } from '@testing-library/react';
import ConstructionAlert from '../../components/layout/ConstructionAlert';

describe('ConstructionAlert', () => {
  it('should render the alert initially', () => {
    render(<ConstructionAlert />);

    expect(screen.getByText(/Site under construction!/)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to Lunara/)).toBeInTheDocument();
  });

  it('should have dismiss button', () => {
    render(<ConstructionAlert />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it('should hide alert when dismiss button is clicked', () => {
    render(<ConstructionAlert />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Site under construction!/)).not.toBeInTheDocument();
  });

  it('should render icons', () => {
    const { container } = render(<ConstructionAlert />);

    // Check for presence of icon elements (FaHardHat and FaTimes)
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper styling classes', () => {
    const { container } = render(<ConstructionAlert />);

    const alertDiv = container.querySelector('.bg-yellow-100');
    expect(alertDiv).toBeInTheDocument();
    expect(alertDiv).toHaveClass('border-b-2');
    expect(alertDiv).toHaveClass('border-yellow-300');
  });
});

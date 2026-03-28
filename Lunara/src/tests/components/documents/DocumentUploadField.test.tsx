import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { DocumentUploadField } from '../../../components/documents/DocumentUploadField';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

function makeFile(name: string, type = 'application/pdf') {
  return new File(['x'], name, { type });
}

describe('DocumentUploadField', () => {
  it('selects file and calls onFileSelected', () => {
    const onFileSelected = jest.fn();
    const inputRef = { current: document.createElement('input') } as React.RefObject<HTMLInputElement>;
    const { container } = render(
      <DocumentUploadField label="Upload" file={null} inputRef={inputRef} onFileSelected={onFileSelected} />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf')] } });
    expect(onFileSelected).toHaveBeenCalled();
  });

  it('runs validate and shows toast error', () => {
    const onFileSelected = jest.fn();
    const inputRef = { current: document.createElement('input') } as React.RefObject<HTMLInputElement>;
    const { container } = render(
      <DocumentUploadField
        label="Upload"
        file={null}
        inputRef={inputRef}
        onFileSelected={onFileSelected}
        validate={() => 'bad'}
      />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf')] } });
    expect(toast.error).toHaveBeenCalledWith('bad');
    expect(onFileSelected).not.toHaveBeenCalled();
  });
});


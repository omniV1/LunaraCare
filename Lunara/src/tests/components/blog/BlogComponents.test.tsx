import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BlogActionButtons } from '../../../components/blog/BlogActionButtons';
import { BlogAutoSaveStatus } from '../../../components/blog/BlogAutoSaveStatus';
import { BlogMetadataForm } from '../../../components/blog/BlogMetadataForm';
import { BLOG_CATEGORIES } from '../../../components/blog/blogCategories';
import { BlogTagInput } from '../../../components/blog/BlogTagInput';
import { BlogFeaturedImage } from '../../../components/blog/BlogFeaturedImage';

jest.mock('../../../components/ui/RichTextEditor', () => ({
  RichTextEditor: (props: any) => (
    <textarea
      data-testid="rte"
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ),
}));
import { BlogContentEditor } from '../../../components/blog/BlogContentEditor';

describe('Blog components', () => {
  it('BlogActionButtons renders correct submit label and triggers callbacks', () => {
    const onCancel = jest.fn();
    const onPublish = jest.fn();
    const { rerender } = render(
      <BlogActionButtons isLoading={false} isEditing={false} onCancel={onCancel} onPublish={onPublish} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument();

    rerender(
      <BlogActionButtons isLoading={false} isEditing={true} onCancel={onCancel} onPublish={onPublish} />,
    );
    expect(screen.getByRole('button', { name: 'Update Draft' })).toBeInTheDocument();

    rerender(
      <BlogActionButtons isLoading={true} isEditing={true} onCancel={onCancel} onPublish={onPublish} />,
    );
    expect(screen.getByRole('button', { name: 'Publishing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('BlogAutoSaveStatus shows saving / last saved / unsaved states', () => {
    const { rerender } = render(
      <BlogAutoSaveStatus isSaving={true} lastSaved={null} hasUnsavedChanges={false} />,
    );
    expect(screen.getByText('Auto-saving...')).toBeInTheDocument();

    rerender(
      <BlogAutoSaveStatus isSaving={false} lastSaved={new Date('2026-03-18T12:00:00.000Z')} hasUnsavedChanges={false} />,
    );
    expect(screen.getByText(/Last saved:/)).toBeInTheDocument();

    rerender(
      <BlogAutoSaveStatus isSaving={false} lastSaved={null} hasUnsavedChanges={true} />,
    );
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('BlogMetadataForm renders categories and calls onChange', () => {
    const onChange = jest.fn();
    render(
      <BlogMetadataForm title="T" category="" excerpt="E" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New title' } });
    expect(onChange).toHaveBeenCalled();

    const select = screen.getByLabelText('Category *');
    fireEvent.change(select, { target: { value: BLOG_CATEGORIES[0] } });
    expect(onChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'New excerpt' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('BlogTagInput adds tags via Enter/click and removes tags', () => {
    const onTagInputChange = jest.fn();
    const onTagAdd = jest.fn();
    const onTagRemove = jest.fn();

    render(
      <BlogTagInput
        tags={['one']}
        tagInput="two"
        onTagInputChange={onTagInputChange}
        onTagAdd={onTagAdd}
        onTagRemove={onTagRemove}
      />,
    );

    const input = screen.getByLabelText('Tags') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'x' } });
    expect(onTagInputChange).toHaveBeenCalledWith('x');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagAdd).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onTagAdd).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onTagRemove).toHaveBeenCalledWith('one');
  });

  it('BlogFeaturedImage renders upload state and remove button', () => {
    const onImageUpload = jest.fn();
    const onImageRemove = jest.fn();
    const { rerender } = render(
      <BlogFeaturedImage
        featuredImage=""
        imageUploading={true}
        onImageUpload={onImageUpload}
        onImageRemove={onImageRemove}
      />,
    );
    expect(screen.getByText('Uploading image...')).toBeInTheDocument();

    rerender(
      <BlogFeaturedImage
        featuredImage="https://example.com/x.png"
        imageUploading={false}
        onImageUpload={onImageUpload}
        onImageRemove={onImageRemove}
      />,
    );
    expect(screen.getByAltText('Featured')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onImageRemove).toHaveBeenCalledTimes(1);
  });

  it('BlogContentEditor wires content into RichTextEditor', () => {
    const onContentChange = jest.fn();
    render(<BlogContentEditor content="<p>hi</p>" onContentChange={onContentChange} />);

    const rte = screen.getByTestId('rte') as HTMLTextAreaElement;
    expect(rte).toHaveValue('<p>hi</p>');
    fireEvent.change(rte, { target: { value: '<p>bye</p>' } });
    expect(onContentChange).toHaveBeenCalledWith('<p>bye</p>');
  });
});


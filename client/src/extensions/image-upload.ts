import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const ImageUpload = Extension.create({
  name: 'imageUpload',

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handleDrop(view, event) {
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;
            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length === 0) return false;

            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
            if (pos == null) return false;

            uploadImages(imageFiles, editor, pos);
            return true;
          },
          handlePaste(view, event) {
            const files = event.clipboardData?.files;
            if (!files || files.length === 0) return false;
            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length === 0) return false;

            event.preventDefault();
            const pos = view.state.selection.from;
            uploadImages(imageFiles, editor, pos);
            return true;
          },
        },
      }),
    ];
  },
});

async function uploadImages(files: File[], editor: any, pos: number) {
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { path } = await res.json();
      editor.chain().focus().insertContentAt(pos, {
        type: 'image',
        attrs: { src: path, alt: file.name },
      }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }
}

/** Standalone function for the /image slash command file picker flow */
export async function uploadImageFromPicker(editor: any): Promise<void> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { path } = await res.json();
      editor.chain().focus().setImage({ src: path, alt: file.name }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };
  input.click();
}

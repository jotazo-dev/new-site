import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Heading1, Heading2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon, RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

export default function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] focus:outline-none px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md bg-background flex flex-col">
      <Toolbar editor={editor} onUploadImage={onUploadImage} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, onUploadImage }: { editor: Editor; onUploadImage?: (f: File) => Promise<string> }) {
  const Btn = ({ active, onClick, title, children }: any) => (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      className="h-8 px-2"
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  function addLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function pickImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = onUploadImage ? await onUploadImage(file) : URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) { console.error(e); }
    };
    input.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/30 sticky top-0 z-10">
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito"><Bold className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico"><Italic className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado"><UIcon className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><Strikethrough className="w-4 h-4" /></Btn>
      <div className="w-px h-5 bg-border mx-1" />
      <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1"><Heading1 className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2"><Heading2 className="w-4 h-4" /></Btn>
      <div className="w-px h-5 bg-border mx-1" />
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada"><ListOrdered className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação"><Quote className="w-4 h-4" /></Btn>
      <div className="w-px h-5 bg-border mx-1" />
      <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Esquerda"><AlignLeft className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centro"><AlignCenter className="w-4 h-4" /></Btn>
      <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Direita"><AlignRight className="w-4 h-4" /></Btn>
      <div className="w-px h-5 bg-border mx-1" />
      <label className="h-8 px-2 inline-flex items-center cursor-pointer text-xs gap-1" title="Cor do texto">
        <input
          type="color"
          className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <Btn onClick={addLink} active={editor.isActive("link")} title="Link"><LinkIcon className="w-4 h-4" /></Btn>
      <Btn onClick={pickImage} title="Imagem"><ImageIcon className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpar formatação"><RemoveFormatting className="w-4 h-4" /></Btn>
    </div>
  );
}

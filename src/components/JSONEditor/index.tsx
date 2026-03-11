import type { TextareaHTMLAttributes } from 'react';

interface JSONEditorProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name'
> {
  name: string;
  value: string;
  onUpdate: (value: string) => void;
}

const JSONEditor = ({ name, value, onUpdate, onBlur }: JSONEditorProps) => {
  return (
    <div className="w-full overflow-hidden rounded-md">
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        onBlur={onBlur}
        spellCheck={false}
        className="h-[300px] w-full resize-y bg-gray-900 p-4 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};

export default JSONEditor;

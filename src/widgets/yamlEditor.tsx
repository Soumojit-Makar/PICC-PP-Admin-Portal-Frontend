import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";

type YamlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
};

const YamlEditor: React.FC<YamlEditorProps> = ({
  value,
  onChange,
  height = "400px",
  readOnly = false,
  placeholder = "# Enter YAML template content...",
}) => {
  return (
    <div
      className="border rounded overflow-hidden dark:border-gray-700"
      style={{ background: "var(--grid-even-row-color, #ffffff)" }}
    >
      <CodeMirror
        value={value}
        height={height}
        extensions={[
          yaml(),
          EditorView.lineWrapping,
          EditorView.theme({
            "&": { fontSize: "13px", fontFamily: "'JetBrains Mono', Consolas, monospace" },
            ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid var(--grid-border-color, #ddd)" },
            "&.cm-focused": { outline: "none" },
          }),
        ]}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(val) => onChange(val)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          autocompletion: true,
        }}
      />
    </div>
  );
};

export default YamlEditor;

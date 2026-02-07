// ==================== FileTree Component ====================

import { ChevronRight, ChevronDown, File, FolderOpen, Folder } from 'lucide-react';
import { useState } from 'react';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

interface FileTreeProps {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function FileTreeNode({
  node,
  level = 0,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  level?: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div>
      {/* Node */}
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer
          hover:bg-gray-100 transition-colors
          ${isSelected ? 'bg-amber-100 text-amber-900' : 'text-gray-700'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            {expanded ? (
              <FolderOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4 h-4 flex-shrink-0" />
            <File className="w-4 h-4 text-gray-600 flex-shrink-0" />
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No files to display
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

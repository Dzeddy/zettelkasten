import React, { useState } from 'react';
import { Check, Square, FileText, Package, X, GripVertical, Copy } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { Theme } from '../../types';
import { Button } from '../ui/Button';
import { ExportItem } from './SearchResults';

interface ExportModalProps {
  theme: Theme;
  exportItems: ExportItem[];
  isOpen: boolean;
  onClose: () => void;
}

interface SortableItemProps {
  item: ExportItem;
  theme: Theme;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, theme, isSelected, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(item.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-3 rounded-lg border transition-all duration-200
        ${theme.border} ${theme.hoverBg}
        ${isSelected ? theme.goldBorder : ''}
        hover:scale-[1.01] hover:shadow-lg hover:z-10 relative
        mx-1
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div 
          className="mt-1 cursor-pointer p-1 -m-1 rounded hover:bg-gray-200/20"
          onClick={handleToggleClick}
        >
          {isSelected ? (
            <Check className={`w-4 h-4 ${theme.goldAccent}`} />
          ) : (
            <Square className={`w-4 h-4 ${theme.textSecondary}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className={`w-4 h-4 ${theme.textSecondary}`} />
            <span className={`font-medium ${theme.text}`}>{item.title}</span>
            <span className={`text-xs px-2 py-1 rounded ${theme.goldAccent} bg-yellow-500/10`}>
              {item.type}
            </span>
          </div>
          <p className={`text-sm ${theme.textSecondary} line-clamp-2`}>
            {item.content.substring(0, 200)}...
          </p>
        </div>
        <div
          {...attributes}
          {...listeners}
          className={`mt-1 p-1 rounded cursor-grab active:cursor-grabbing ${theme.hoverBg} hover:bg-gray-300/20`}
        >
          <GripVertical className={`w-4 h-4 ${theme.textSecondary}`} />
        </div>
      </div>
    </div>
  );
};

export const ExportModal: React.FC<ExportModalProps> = ({
  theme,
  exportItems,
  isOpen,
  onClose,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter out document items, only show chunks, and maintain order state
  const [orderedChunkItems, setOrderedChunkItems] = useState<ExportItem[]>(() => 
    exportItems.filter(item => item.type === 'chunk')
  );

  // Update ordered items when exportItems changes
  React.useEffect(() => {
    setOrderedChunkItems(exportItems.filter(item => item.type === 'chunk'));
  }, [exportItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedChunkItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(orderedChunkItems.map(item => item.id)));
    // Remove focus from button to stop hover effects
    (document.activeElement as HTMLElement)?.blur();
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
    // Remove focus from button to stop hover effects
    (document.activeElement as HTMLElement)?.blur();
  };

  const exportSelected = () => {
    const selectedExportItems = orderedChunkItems.filter(item => selectedItems.has(item.id));
    
    if (selectedExportItems.length === 0) {
      return;
    }

    // Create export content - all items are chunks now, in the user's chosen order
    const exportContent = selectedExportItems
      .map(item => {
        const header = `## ${item.title}\n\n`;
        return header + item.content;
      })
      .join('\n\n---\n\n');

    // Create and download file
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onClose();
    setSelectedItems(new Set());
  };

  const copyToClipboard = async () => {
    // Create content from selected chunks in current display order
    const selectedChunks = orderedChunkItems.filter(item => selectedItems.has(item.id));
    
    if (selectedChunks.length === 0) {
      return;
    }

    const copyContent = selectedChunks
      .map(item => {
        const header = `## ${item.title}\n\n`;
        return header + item.content;
      })
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(copyContent);
      // You could add a toast notification here if you have one
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = copyContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Get the appropriate background color based on theme
  const getModalBackgroundStyle = () => {
    // Use the existing theme system instead of hardcoded colors
    return {
      backdropFilter: 'blur(8px)',
    };
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Background overlay with enhanced blur and opacity */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal content with proper theme integration */}
      <div className="relative flex items-center justify-center min-h-screen p-4 pointer-events-none">
        <div 
          className={`
            ${theme.cardBg}
            rounded-lg 
            p-6 
            max-w-4xl 
            max-h-[80vh] 
            w-full 
            overflow-hidden 
            flex 
            flex-col 
            shadow-2xl 
            pointer-events-auto
            relative
            isolate
            border
            ${theme.border}
            backdrop-blur-sm
          `}
          style={getModalBackgroundStyle()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${theme.text}`}>Export Search Results</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.hoverBg} hover:bg-red-500/10 transition-colors`}
            >
              <X className={`w-5 h-5 ${theme.text}`} />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <Button onClick={selectAll} variant="secondary" theme={theme} size="sm">
              Select All
            </Button>
            <Button onClick={deselectAll} variant="secondary" theme={theme} size="sm">
              Deselect All
            </Button>
            <div className={`text-sm ${theme.textSecondary} flex items-center`}>
              {selectedItems.size} of {orderedChunkItems.length} items selected
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 px-1 py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={orderedChunkItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedChunkItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    theme={theme}
                    isSelected={selectedItems.has(item.id)}
                    onToggle={toggleItemSelection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex justify-between gap-3">
            <Button
              onClick={copyToClipboard}
              variant="secondary"
              theme={theme}
              className="flex items-center gap-2"
              disabled={selectedItems.size === 0}
            >
              <Copy className="w-4 h-4" />
              Copy Selected
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="secondary"
                theme={theme}
              >
                Cancel
              </Button>
              <Button
                onClick={exportSelected}
                disabled={selectedItems.size === 0}
                theme={theme}
                className={`${theme.goldGradient} text-black`}
              >
                Export Selected ({selectedItems.size})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
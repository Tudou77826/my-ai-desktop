// ==================== Wishlist Panel Component ====================

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Star } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { WishlistItem } from '../lib/api';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface WishlistPanelProps {
  type: 'mcp' | 'skills' | 'subagents';
}

export function WishlistPanel({ type }: WishlistPanelProps) {
  const { wishlist, loadWishlist, addWishlistItem, updateWishlistItem, removeWishlistItem } = useAppStore();
  const { showToast } = useToast();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Load items based on type
  useEffect(() => {
    setItems(wishlist[type]);
  }, [wishlist, type]);

  // Initial load
  useEffect(() => {
    loadWishlist();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      await addWishlistItem(type, newTitle.trim(), newNotes.trim());
      setNewTitle('');
      setNewNotes('');
      setShowAddForm(false);
      showToast('Item added to wishlist', 'success');
    } catch (error) {
      showToast(`Failed to add item: ${(error as Error).message}`, 'error');
    }
  };

  const handleUpdate = async (itemId: string) => {
    if (!editTitle.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      await updateWishlistItem(type, itemId, {
        title: editTitle.trim(),
        notes: editNotes.trim(),
      });
      setEditingId(null);
      showToast('Item updated', 'success');
    } catch (error) {
      showToast(`Failed to update item: ${(error as Error).message}`, 'error');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await removeWishlistItem(type, itemId);
      showToast('Item removed', 'success');
    } catch (error) {
      showToast(`Failed to remove item: ${(error as Error).message}`, 'error');
    }
  };

  const handleToggleCompleted = async (item: WishlistItem) => {
    try {
      await updateWishlistItem(type, item.id, { completed: !item.completed });
    } catch (error) {
      showToast(`Failed to update item: ${(error as Error).message}`, 'error');
    }
  };

  const startEdit = (item: WishlistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditNotes(item.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditNotes('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'mcp' ? 'MCP Servers' : type === 'subagents' ? 'SubAgents' : 'Skills'} Wishlist
          </h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {items.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <Input
              placeholder="Title (e.g., 'Add GitHub MCP server')"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAdd}
                className="bg-amber-600 hover:bg-amber-700"
                size="sm"
              >
                <Check className="w-4 h-4 mr-1" />
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle('');
                  setNewNotes('');
                }}
                size="sm"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No items in wishlist yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add items you plan to configure later
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-3 transition-colors ${
                item.completed
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {editingId === item.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleUpdate(item.id)}
                      className="bg-amber-600 hover:bg-amber-700"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleCompleted(item)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-amber-600 border-amber-600'
                        : 'border-gray-300 hover:border-amber-600'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-gray-900 ${
                        item.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.notes && (
                      <p
                        className={`text-sm mt-1 whitespace-pre-wrap ${
                          item.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
